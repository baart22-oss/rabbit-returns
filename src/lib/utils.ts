// Utility functions and classname helper

/**
 * Generate a unique class name by combining base class with additional modifiers.
 * @param base - The base class name.
 * @param modifiers - An array of additional class names to combine.
 * @returns A string of combined class names.
 */
function classNameHelper(base: string, ...modifiers: string[]): string {
    return [base, ...modifiers].filter(Boolean).join(' ');
}

/**
 * Example utility function to check if a value is a number.
 * @param value - The value to check.
 * @returns True if the value is a number, false otherwise.
 */
function isNumber(value: any): value is number {
    return typeof value === 'number';
}

// Exporting the utility functions
export { classNameHelper, isNumber };