import { StyleSheet } from 'react-native';
import { colors } from '../themes/Colors';
import { spacing } from '../themes/Spacing';

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    inner: {
        flexGrow: 1,
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xxl,
    },
    form: {
        width: '100%',
        alignItems: 'center',
    },
});