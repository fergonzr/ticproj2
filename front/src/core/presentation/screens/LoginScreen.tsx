import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import HamburgerHeader from '../components/HamburgerHeader';
import SIEELogo from '../components/SieeLogo';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import styles from '../styles/LoginScreen.styles';
import {useSafeAreaInsets} from "react-native-safe-area-context";

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const inserts = useSafeAreaInsets();

    const handleLogin = () => {
        // TODO: connect to useAuth hook
        console.log('Login with', email, password);
    };

return (
        <KeyboardAvoidingView
            style={[styles.container, {paddingTop : inserts.top}]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.inner}
                keyboardShouldPersistTaps="handled"
            >
                <HamburgerHeader />

                <SIEELogo />

                <View style={styles.form}>
                    <AppInput
                        label="Correo"
                        placeholder="javier.pelaez@envigado.gov.co"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />

                    <AppInput
                        label="Contraseña"
                        placeholder="••••••••••••••••••••••••"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <AppButton
                        title="Iniciar Sesion"
                        variant="outlined"
                        onPress={handleLogin}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default LoginScreen;