/**
 * typography.ts
 * Central definition of all font sizes and font weights used in the app.
 * Using named values instead of raw numbers ensures text is visually
 * consistent across all screens and components.
 */
export const typography = {
    sizeSmall: 12,
    sizeBody: 14,
    sizeMedium: 15,
    sizeLarge: 18,
    sizeXLarge: 22,
    weightRegular: '400' as const,
    weightMedium: '500' as const,
    weightBold: 'bold' as const,

};
