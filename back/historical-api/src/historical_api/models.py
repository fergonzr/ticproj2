from datetime import datetime
from typing import Dict, List

import numpy as np
from core.domain.entities.emergency import EmergencyStatus
from core.domain.entities.historical_emergency import HistoricalEmergency
from pydantic import BaseModel

# Generate even hour brackets: deliberately adding last number (24)
hourBrackets = [i for i in range(0, 25, 2)]


def _compute_average_timeline(
    emergencies: List[HistoricalEmergency],
) -> Dict[EmergencyStatus, float]:

    # We are not interested on terminal statuses
    sumTimeline = {
        status: 0.0
        for status in EmergencyStatus
        if status != EmergencyStatus.CANCELED and status != EmergencyStatus.CLOSED
    }

    for e in emergencies:
        if (
            EmergencyStatus.CLOSED in e.timeline
            and EmergencyStatus.CANCELED not in e.timeline
        ):
            sumTimeline[EmergencyStatus.RECEIVED] += (
                e.timeline[EmergencyStatus.TRIAGED]
                - e.timeline[EmergencyStatus.RECEIVED]
            ).total_seconds()
            sumTimeline[EmergencyStatus.TRIAGED] += (
                e.timeline[EmergencyStatus.ASSIGNED]
                - e.timeline[EmergencyStatus.TRIAGED]
            ).total_seconds()
            sumTimeline[EmergencyStatus.ASSIGNED] += (
                e.timeline[EmergencyStatus.ON_SITE]
                - e.timeline[EmergencyStatus.ASSIGNED]
            ).total_seconds()

            # Guard against emergency cases that are resolved on site
            sumTimeline[EmergencyStatus.ON_SITE] += (
                (
                    e.timeline[EmergencyStatus.IN_TRANSFER]
                    if EmergencyStatus.IN_TRANSFER
                    else e.timeline[EmergencyStatus.SOLVED]
                )
                - e.timeline[EmergencyStatus.ASSIGNED]
            ).total_seconds()
            sumTimeline[EmergencyStatus.IN_TRANSFER] += (
                (
                    e.timeline[EmergencyStatus.SOLVED]
                    - e.timeline[EmergencyStatus.IN_TRANSFER]
                ).total_seconds()
                if e.timeline[EmergencyStatus.IN_TRANSFER]
                else 0
            )

            sumTimeline[EmergencyStatus.SOLVED] += (
                e.timeline[EmergencyStatus.CLOSED] - e.timeline[EmergencyStatus.SOLVED]
            ).total_seconds()

    # Return average
    return {key: val / len(emergencies) for (key, val) in sumTimeline.items()}


def _calculate_hour_histogram(
    emergencies: List[HistoricalEmergency],
) -> Dict[int, int]:
    hist, _ = np.histogram(
        [e.timeline[EmergencyStatus.RECEIVED].hour for e in emergencies],
        bins=hourBrackets,
    )
    return {hourBrackets[i]: hist[i] for i in range(len(hist))}


class Statistics(BaseModel):
    """The emergency statistics for a given time interval

    Attributes:
        since: The starting datetime on which the statistics are
            calculated.
        to: The ending datetime on which the statistics are calculated.
        emergencyCount: The number of emergencies received between
            since and to.
        averageTotalTime: The average number of seconds that an
            emergency took to be closed or cancelled.
        averageTimeline: The average numer of seconds that an emergency
            spent on the given state.
        hourHistogram: How many emergencies were received on a given
            hour bracket.
    """

    since: datetime
    to: datetime
    emergencyCount: int
    averageTotalTime: float
    averageTimeline: Dict[EmergencyStatus, float]
    hourHistogram: Dict[int, int]

    @classmethod
    def from_domain(
        cls, emergencies: List[HistoricalEmergency], since: datetime, to: datetime
    ):
        emergencyCount = len(emergencies)
        return cls(
            since=since,
            to=to,
            emergencyCount=emergencyCount,
            averageTotalTime=sum(
                (
                    e.timeline[EmergencyStatus.CLOSED]
                    - e.timeline[EmergencyStatus.RECEIVED]
                ).total_seconds()
                for e in emergencies
                # Filter out cancelled emergencies for this computation
                if EmergencyStatus.CLOSED in e.timeline
            )
            / emergencyCount,
            averageTimeline=_compute_average_timeline(emergencies),
            hourHistogram=_calculate_hour_histogram(emergencies),
        )
