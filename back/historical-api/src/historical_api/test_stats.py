from datetime import datetime, timedelta

import pytest

from .stats import StatisticsHolder


class TestStatisticsHolder:
    def test_intersect_basic(self):
        """Test basic intersection calculation"""
        since1 = datetime(2023, 1, 1)
        to1 = datetime(2023, 12, 31)
        since2 = datetime(2023, 6, 1)
        to2 = datetime(2023, 8, 31)

        result = StatisticsHolder._intersect(since1, to1, since2, to2)
        expected = (datetime(2023, 6, 1), datetime(2023, 8, 31))
        assert result == expected

    def test_intersect_no_overlap(self):
        """Test intersection with no overlap"""
        since1 = datetime(2023, 1, 1)
        to1 = datetime(2023, 3, 31)
        since2 = datetime(2023, 4, 1)
        to2 = datetime(2023, 6, 30)

        result = StatisticsHolder._intersect(since1, to1, since2, to2)
        expected = (datetime(2023, 4, 1), datetime(2023, 3, 31))
        assert result == expected
        assert result[0] >= result[1]  # No overlap condition

    def test_intersect_complete_overlap(self):
        """Test intersection with complete overlap"""
        since1 = datetime(2023, 1, 1)
        to1 = datetime(2023, 12, 31)
        since2 = datetime(2023, 3, 1)
        to2 = datetime(2023, 9, 30)

        result = StatisticsHolder._intersect(since1, to1, since2, to2)
        expected = (datetime(2023, 3, 1), datetime(2023, 9, 30))
        assert result == expected

    def test_intersect_partial_overlap(self):
        """Test intersection with partial overlap"""
        since1 = datetime(2023, 3, 1)
        to1 = datetime(2023, 9, 30)
        since2 = datetime(2023, 1, 1)
        to2 = datetime(2023, 6, 30)

        result = StatisticsHolder._intersect(since1, to1, since2, to2)
        expected = (datetime(2023, 3, 1), datetime(2023, 6, 30))
        assert result == expected

    def test_intersect_proportion_no_overlap(self):
        """Test proportion calculation with no overlap"""
        since1 = datetime(2023, 1, 1)
        to1 = datetime(2023, 3, 31)
        since2 = datetime(2023, 4, 1)
        to2 = datetime(2023, 6, 30)

        result = StatisticsHolder._intersect_proportion(since1, to1, since2, to2)
        assert result == 0.0

    def test_intersect_proportion_complete_overlap(self):
        """Test proportion calculation with complete overlap"""
        since1 = datetime(2023, 1, 1)
        to1 = datetime(2023, 12, 31)
        since2 = datetime(2023, 1, 1)
        to2 = datetime(2023, 12, 31)

        result = StatisticsHolder._intersect_proportion(since1, to1, since2, to2)
        assert result == 1.0

    def test_intersect_proportion_partial_overlap(self):
        """Test proportion calculation with partial overlap"""
        since1 = datetime(2023, 1, 1)
        to1 = datetime(2023, 12, 31)
        since2 = datetime(2023, 3, 1)
        to2 = datetime(2023, 9, 30)

        # Calculate expected proportion manually
        total_duration = (to1 - since1).days
        intersection_duration = (datetime(2023, 9, 30) - datetime(2023, 3, 1)).days
        expected_proportion = intersection_duration / total_duration

        result = StatisticsHolder._intersect_proportion(since1, to1, since2, to2)
        assert abs(result - expected_proportion) < 0.0001

    def test_intersect_proportion_smaller_interval_larger(self):
        """Test proportion calculation where second interval is larger"""
        since1 = datetime(2023, 3, 1)
        to1 = datetime(2023, 6, 30)  # 121 days
        since2 = datetime(2023, 1, 1)
        to2 = datetime(2023, 12, 31)  # 364 days

        # Should use the larger interval (since2, to2) for proportion calculation
        intersection = (datetime(2023, 3, 1), datetime(2023, 6, 30))
        intersection_duration = (intersection[1] - intersection[0]).days
        larger_interval_duration = (to2 - since2).days
        expected_proportion = intersection_duration / larger_interval_duration

        result = StatisticsHolder._intersect_proportion(since1, to1, since2, to2)
        assert abs(result - expected_proportion) < 0.0001

    def test_intersect_proportion_edge_case_same_start(self):
        """Test proportion calculation where intervals start at same time"""
        since1 = datetime(2023, 1, 1)
        to1 = datetime(2023, 6, 30)
        since2 = datetime(2023, 1, 1)
        to2 = datetime(2023, 3, 31)

        result = StatisticsHolder._intersect_proportion(since1, to1, since2, to2)
        # Should be (3/6) = 0.5 since we use the larger interval (since1, to1)
        expected = (to2 - since2).days / (to1 - since1).days
        assert abs(result - expected) < 0.0001

    def test_intersect_proportion_edge_case_same_end(self):
        """Test proportion calculation where intervals end at same time"""
        since1 = datetime(2023, 4, 1)
        to1 = datetime(2023, 12, 31)
        since2 = datetime(2023, 9, 1)
        to2 = datetime(2023, 12, 31)

        result = StatisticsHolder._intersect_proportion(since1, to1, since2, to2)
        # Should be (3/9) = 0.333... since we use the larger interval (since1, to1)
        expected = (to2 - since2).days / (to1 - since1).days
        assert abs(result - expected) < 0.0001

    def test_intersect_with_timedelta(self):
        """Test intersection calculation using timedelta"""
        now = datetime.now()
        since1 = now - timedelta(days=100)
        to1 = now + timedelta(days=100)
        since2 = now - timedelta(days=50)
        to2 = now + timedelta(days=50)

        result = StatisticsHolder._intersect(since1, to1, since2, to2)
        expected = (since2, to2)
        assert result == expected
