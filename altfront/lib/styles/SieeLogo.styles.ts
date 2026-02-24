import { StyleSheet } from 'react-native';
import { spacing } from '../themes/Spacing';
import { colors } from '../themes/Colors';

export default StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: spacing.xl,
    },
    circle: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: colors.white,
    },
});