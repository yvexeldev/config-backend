import fs from 'fs';
import path from 'path';
import { Logger } from '../logger/logger';

const logger = new Logger({
    context: 'Environment Variables',
    logToFile: true,
    
});

class EnvironmentVariables {
    private static instance: EnvironmentVariables;
    private env: Record<string, string | undefined> = {};

    private constructor() {
        this.loadEnvironmentVariables();
    }

    public static getInstance(): EnvironmentVariables {
        if (!EnvironmentVariables.instance) {
            EnvironmentVariables.instance = new EnvironmentVariables();
        }
        return EnvironmentVariables.instance;
    }

    private loadEnvironmentVariables(): void {
        // Determine the current environment
        const nodeEnv = process.env.NODE_ENV || 'development';

        // Array of potential .env file locations
        const envFiles = [
            `.env.${nodeEnv}.local`,
            `.env.${nodeEnv}`,
            '.env.local',
            '.env',
        ];

        // Find the first existing env file
        const envFilePath = envFiles.find((file) =>
            fs.existsSync(path.resolve(process.cwd(), file)),
        );

        if (envFilePath) {
            const fullPath = path.resolve(process.cwd(), envFilePath);
            logger.info(`Loading environment variables from: ${fullPath}`);
        }

        this.env = { ...process.env };
    }

    private parseValue<T extends string | number | boolean>(
        value: string,
        type: 'string' | 'number' | 'boolean',
    ): T {
        switch (type) {
            case 'string':
                return value as T;
            case 'number':
                const numberValue = Number(value);
                if (isNaN(numberValue)) {
                    throw new Error(
                        `Environment variable is not a valid number`,
                    );
                }
                return numberValue as T;
            case 'boolean':
                const lowercaseValue = value.toLowerCase().trim();
                if (['true', '1', 'yes', 'on'].includes(lowercaseValue))
                    return true as T;
                if (['false', '0', 'no', 'off'].includes(lowercaseValue))
                    return false as T;
                throw new Error(`Environment variable is not a valid boolean`);
        }
    }

    public get<T extends string | number | boolean>(
        key: string,
        defaultValue?: T,
    ): T {
        const value = this.env[key];

        // If no value exists and no default, throw error
        if (value === undefined) {
            // If default value is provided, return it
            if (defaultValue !== undefined) {
                return defaultValue;
            }

            // Otherwise, throw an error
            throw new Error(`Environment variable '${key}' is not defined`);
        }

        // If default value is a number, parse as number
        if (typeof defaultValue === 'number') {
            return this.parseValue<T>(value, 'number');
        }

        // If default value is a boolean, parse as boolean
        if (typeof defaultValue === 'boolean') {
            return this.parseValue<T>(value, 'boolean');
        }

        // Default to string
        return value as T;
    }

    public getRequired<T extends string | number | boolean>(key: string): T {
        const value = this.env[key];

        if (value === undefined) {
            throw new Error(
                `Required environment variable '${key}' is not set`,
            );
        }

        // Determine type and parse accordingly
        if (typeof value === 'string') {
            if (!isNaN(Number(value))) {
                return this.parseValue<T>(value, 'number');
            }
            if (
                value.toLowerCase() === 'true' ||
                value.toLowerCase() === 'false'
            ) {
                return this.parseValue<T>(value, 'boolean');
            }
        }

        return value as T;
    }

    public validateConfig(requiredKeys: string[]): void {
        const missingKeys = requiredKeys.filter(
            (key) => this.env[key] === undefined,
        );

        if (missingKeys.length > 0) {
            throw new Error(
                `Missing required environment variables: ${missingKeys.join(
                    ', ',
                )}`,
            );
        }
    }
}

// Export a singleton instance
export const environmentVariables = EnvironmentVariables.getInstance();
