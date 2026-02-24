import { StyleSheet } from 'react-native';
import { colors } from '../themes/Colors';
import { spacing } from '../themes/Spacing';
import { typography } from '../themes/Typography';

export default StyleSheet.create({
    base: {
        borderRadius: spacing.sm,
        paddingVertical: spacing.sm + 4,
        paddingHorizontal: spacing.xxl,
        alignItems: 'center',
        marginTop: spacing.lg + 4,
    },
    outlined: {
        borderWidth: 1,
        borderColor: colors.borderButton,
        backgroundColor: colors.white,
    },
    filled: {
        backgroundColor: colors.primary,
        borderWidth: 0,
    },
    cancel: {
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white,
    },
    textOutlined: {
        fontSize: typography.sizeMedium,
        color: colors.text,
        fontWeight: typography.weightRegular,
    },
    textFilled: {
        fontSize: typography.sizeMedium,
        color: colors.white,
        fontWeight: typography.weightMedium,
    },
    textCancel: {
        fontSize: typography.sizeMedium,
        color: colors.textLight,
        fontWeight: typography.weightRegular,
    },
});