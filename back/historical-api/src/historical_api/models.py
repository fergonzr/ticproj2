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
    return {
        key: (val / len(emergencies)) if len(emergencies) > 0 else 0
        for (key, val) in sumTimeline.items()
    }


def _calculate_hour_histogram(
    emergencies: List[HistoricalEmergency],
) -> Dict[int, int]:
    hist, _ = np.histogram(
        [e.timeline[EmergencyStatus.RECEIVED].hour for e in emergencies],
        bins=hourBrackets,
    )
    return {hourBrackets[i]: hist[i] for i in range(len(hist))}


class OperatorRankingEntry(BaseModel):
    """Represents an entry in the operator ranking.

    Attributes:
        operator_id: The unique identifier of the operator.
        name: The name of the operator.
        count: The number of emergencies operated by this operator.
        averageHandlingTime: The average time in seconds from emergency
            received to triaged.
    """

    operator_id: str
    name: str
    count: int
    averageHandlingTime: float


class ParamedicRankingEntry(BaseModel):
    """Represents an entry in the paramedic ranking.

    Attributes:
        paramedic_id: The unique identifier of the paramedic.
        name: The name of the paramedic.
        count: The number of emergencies assigned to this paramedic.
        averageHandlingTime: The average time in seconds from assigned to solved.
    """

    paramedic_id: str
    name: str
    count: int
    averageHandlingTime: float


def _compute_operator_handling_time(
    emergencies: List[HistoricalEmergency],
) -> Dict[str, float]:
    """Compute average handling time for operators.

    The handling time for operators is the time from RECEIVED to TRIAGED.
    """
    operator_time_sum: Dict[str, float] = {}
    operator_count: Dict[str, int] = {}

    for e in emergencies:
        if e.operatedBy is not None and EmergencyStatus.TRIAGED in e.timeline:
            operator_id = str(e.operatedBy.id)
            handling_time = (
                e.timeline[EmergencyStatus.TRIAGED]
                - e.timeline[EmergencyStatus.RECEIVED]
            ).total_seconds()

            operator_time_sum[operator_id] = (
                operator_time_sum.get(operator_id, 0) + handling_time
            )
            operator_count[operator_id] = operator_count.get(operator_id, 0) + 1

    return {
        oid: operator_time_sum[oid] / operator_count[oid] for oid in operator_time_sum
    }


def _compute_operator_ranking(
    emergencies: List[HistoricalEmergency],
) -> List[OperatorRankingEntry]:
    """Compute a ranking of operators by the number of emergencies they operated."""
    operator_name_map: Dict[str, str] = {}
    operator_count: Dict[str, int] = {}

    for e in emergencies:
        if e.operatedBy is not None:
            operator_id = str(e.operatedBy.id)
            operator_name_map[operator_id] = e.operatedBy.name
            operator_count[operator_id] = operator_count.get(operator_id, 0) + 1

    # Sort by count in descending order
    sorted_operators = sorted(operator_count.items(), key=lambda x: x[1], reverse=True)

    handling_times = _compute_operator_handling_time(emergencies)

    return [
        OperatorRankingEntry(
            operator_id=oid,
            name=operator_name_map[oid],
            count=count,
            averageHandlingTime=handling_times.get(oid, 0),
        )
        for oid, count in sorted_operators
    ]


def _compute_paramedic_handling_time(
    emergencies: List[HistoricalEmergency],
) -> Dict[str, float]:
    """Compute average handling time for paramedics.

    The handling time for paramedics is the time from ASSIGNED to SOLVED.
    """
    paramedic_time_sum: Dict[str, float] = {}
    paramedic_count: Dict[str, int] = {}

    for e in emergencies:
        if e.assignedTo is not None and EmergencyStatus.SOLVED in e.timeline:
            paramedic_id = str(e.assignedTo.id)
            handling_time = (
                e.timeline[EmergencyStatus.SOLVED]
                - e.timeline[EmergencyStatus.ASSIGNED]
            ).total_seconds()

            paramedic_time_sum[paramedic_id] = (
                paramedic_time_sum.get(paramedic_id, 0) + handling_time
            )
            paramedic_count[paramedic_id] = paramedic_count.get(paramedic_id, 0) + 1

    return {
        pid: paramedic_time_sum[pid] / paramedic_count[pid]
        for pid in paramedic_time_sum
    }


def _compute_paramedic_ranking(
    emergencies: List[HistoricalEmergency],
) -> List[ParamedicRankingEntry]:
    """Compute a ranking of paramedics by the number of emergencies they were assigned to."""
    paramedic_name_map: Dict[str, str] = {}
    paramedic_count: Dict[str, int] = {}

    for e in emergencies:
        if e.assignedTo is not None:
            paramedic_id = str(e.assignedTo.id)
            paramedic_name_map[paramedic_id] = e.assignedTo.name
            paramedic_count[paramedic_id] = paramedic_count.get(paramedic_id, 0) + 1

    # Sort by count in descending order
    sorted_paramedics = sorted(
        paramedic_count.items(), key=lambda x: x[1], reverse=True
    )

    handling_times = _compute_paramedic_handling_time(emergencies)

    return [
        ParamedicRankingEntry(
            paramedic_id=pid,
            name=paramedic_name_map[pid],
            count=count,
            averageHandlingTime=handling_times.get(pid, 0),
        )
        for pid, count in sorted_paramedics
    ]


class Statistics(BaseModel):
    """The emergency statistics for a given time interval

    Attributes:
        since: The starting datetime on which the statistics are
            calculated.
        to: The ending datetime on which the statistics are calculated.
        emergencyCount: The number of emergencies received between
            since and to.
        averageTotalTime: The average number of seconds that an
            emergency took to be closed.
        averageTotalTimeStdDev: Standard deviation on the total time
            emergencies take to be closed or cancelled, in seconds.
        averageTimeline: The average numer of seconds that an emergency
            spent on the given state.
        hourHistogram: How many emergencies were received on a given
            hour bracket.
        operatorRanking: A ranking of operators by the number of emergencies
            they operated, sorted in descending order by count. Each entry
            includes the average handling time in seconds (from RECEIVED to TRIAGED).
        paramedicRanking: A ranking of paramedics by the number of emergencies
            they were assigned to, sorted in descending order by count. Each entry
            includes the average handling time in seconds (from ASSIGNED to SOLVED).
    """

    since: datetime
    to: datetime
    emergencyCount: int
    averageTotalTime: float
    averageTotalTimeStdev: float
    averageTimeline: Dict[EmergencyStatus, float]
    hourHistogram: Dict[int, int]
    operatorRanking: List[OperatorRankingEntry]
    paramedicRanking: List[ParamedicRankingEntry]

    @classmethod
    def from_domain(
        cls, emergencies: List[HistoricalEmergency], since: datetime, to: datetime
    ):
        emergencyCount = len(emergencies)
        return cls(
            since=since,
            to=to,
            emergencyCount=emergencyCount,
            averageTotalTime=(
                sum(
                    (
                        e.timeline[EmergencyStatus.CLOSED]
                        - e.timeline[EmergencyStatus.RECEIVED]
                    ).total_seconds()
                    for e in emergencies
                    # Filter out cancelled emergencies for this computation
                    if EmergencyStatus.CLOSED in e.timeline
                )
                / emergencyCount
            )
            if emergencyCount > 0
            else 0,
            averageTotalTimeStdev=float(
                np.std(
                    [
                        (
                            e.timeline[EmergencyStatus.CLOSED]
                            - e.timeline[EmergencyStatus.RECEIVED]
                        ).total_seconds()
                        for e in emergencies
                        # Filter out cancelled emergencies for this computation
                        if EmergencyStatus.CLOSED in e.timeline
                    ]
                )
            ),
            averageTimeline=_compute_average_timeline(emergencies),
            hourHistogram=_calculate_hour_histogram(emergencies),
            operatorRanking=_compute_operator_ranking(emergencies),
            paramedicRanking=_compute_paramedic_ranking(emergencies),
        )
