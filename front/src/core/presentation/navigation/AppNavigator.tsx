import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Login" component={LoginScreen} />
                {/* Add more screens here as we build them */}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;