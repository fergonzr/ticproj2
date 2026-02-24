import { StyleSheet } from 'react-native';
import { colors } from '../themes/Colors';
import { spacing } from '../themes/Spacing';
import { typography } from '../themes/Typography';

export default StyleSheet.create({
    container: {
        width: '100%',
        marginTop: spacing.md,
    },
    label: {
        fontSize: typography.sizeBody,
        color: colors.textLight,
        marginBottom: spacing.xs + 2,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: spacing.sm,
        paddingHorizontal: spacing.md - 2,
        paddingVertical: spacing.sm + 2,
        fontSize: typography.sizeBody,
        color: colors.text,
        backgroundColor: colors.white,
        textAlign: 'center',
    },
});