from datetime import datetime
from typing import Dict, List, Tuple

from core.domain.entities.historical_emergency import HistoricalEmergency

from .models import Statistics

"""How much two intervals need to intersect to not schedule a recalculation
of statistics on the background"""
RECALCULATE_INTERSECT_PROPORTION_THRESHOLD = 0.8

"""How much two intervals need to intersect to schedule a calculation
of statistics right away"""
CALCULATE_INTERSECT_PROPORTION_THRESHOLD = 0.6

MAX_STORED_STATISTICS = 100


class StatisticsHolder:
    _statsMap: Dict[Tuple[datetime, datetime], Statistics]

    def __init__(self) -> None:
        self._statsMap = {}

    @staticmethod
    def _intersect(
        since1: datetime, to1: datetime, since2: datetime, to2: datetime
    ) -> Tuple[datetime, datetime]:
        """Calculate the intersection between two (valid) datetime ranges.

        Returns:
            A tuple of the form (since, to), representing the intersection.
        """

        return (max(since1, since2), min(to1, to2))

    @staticmethod
    def _intersect_proportion(
        since1: datetime, to1: datetime, since2: datetime, to2: datetime
    ) -> float:
        """Calculate the proportion that one datetime interval intersects with another.

        Returns:
            A float, between 0 and 1, inclusive, that encodes how much
            of the larger interval is covered by the intersection
            between the two.
        """

        intersection = StatisticsHolder._intersect(since1, to1, since2, to2)

        # The date ranges do not intersect
        if intersection[0] >= intersection[1]:
            return 0.0

        largestInterval = (
            (since1, to1) if (to1 - since1) > (to2 - since2) else (since2, to2)
        )
        largestIntervalDuration = largestInterval[1] - largestInterval[0]
        intersectionDuration = intersection[1] - intersection[0]

        return intersectionDuration / largestIntervalDuration

    def _retrieve_closest_stored(
        self, since: datetime, to: datetime
    ) -> Tuple[datetime, datetime]:
        """Retrieve the closest stored statistic key from since and to"""

        return max(
            (
                (key, self._intersect_proportion(since, to, key[0], key[1]))
                for key in self._statsMap.keys()
            ),
            key=lambda item: item[1],
        )[0]

    def retrieve_statistics(
        self, since: datetime, to: datetime
    ) -> Tuple[Statistics, float]:
        """Retrieve the statistics on a given time range

        Returns:
            A tuple containing the (approximate) statistics on the
            given time interval and the intersection propotion between
            the two.

        Raises:
            NoStatisticsError if there are no statistics stored.
        """
        if not self._statsMap:
            raise NoStatisticsError

        return max(
            (
                (value, self._intersect_proportion(since, to, key[0], key[1]))
                for (key, value) in self._statsMap.items()
            ),
            key=lambda item: item[1],
        )

    def compute_statistics(
        self, emergencies: List[HistoricalEmergency], since: datetime, to: datetime
    ) -> Statistics:
        statistics = Statistics.from_domain(emergencies, since, to)

        # Delete closest stored stats if we are reaching our limit:
        if len(self._statsMap) >= MAX_STORED_STATISTICS:
            self._statsMap.pop(self._retrieve_closest_stored(since, to))

        self._statsMap[(since, to)] = statistics
        return statistics


class NoStatisticsError(Exception):
    pass
