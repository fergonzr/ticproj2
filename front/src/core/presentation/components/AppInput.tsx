import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import styles from '../styles/AppInput.styles';
import { colors } from '../themes/Colors';

interface AppInputProps extends TextInputProps {
    label: string;
}

const AppInput = ({ label, ...props }: AppInputProps) => {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={styles.input}
                placeholderTextColor={colors.placeholder}
                {...props}
            />
        </View>
    );
};

export default AppInput;