import { StyleSheet } from 'react-native';
import { colors } from '../themes/Colors';
import { spacing } from '../themes/Spacing';
import { typography } from '../themes/Typography';

export default StyleSheet.create({
    header: {
        alignItems: 'flex-end',
        paddingTop: spacing.md,
        marginBottom: spacing.sm,
    },
    icon: {
        fontSize: typography.sizeXLarge,
        color: colors.text,
    },
});