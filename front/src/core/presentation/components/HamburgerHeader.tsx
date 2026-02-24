import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from '../styles/HamburgerHeader.styles';

interface HamburgerHeaderProps {
    onPress?: () => void;
}

const HamburgerHeader = ({ onPress }: HamburgerHeaderProps) => {
    return (
        <View style={styles.header}>
            <TouchableOpacity onPress={onPress}>
                <Text style={styles.icon}>☰</Text>
            </TouchableOpacity>
        </View>
    );
};

export default HamburgerHeader;