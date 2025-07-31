// WARNING: This file contains FAKE secrets for TruffleHog testing purposes only
// These are NOT real credentials and should never be used in production

export const DemoSecrets = {
// Fake AWS credentials (TruffleHog will detect these patterns)
AWS_ACCESS_KEY_ID: "AKIAIOSFODNN7EXAMPLE",
AWS_SECRET_ACCESS_KEY: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",

// Fake API keys that look realistic but are dummy values
STRIPE_SECRET_KEY: "sk_test_1234567890abcdef1234567890abcdef12345678",
GITHUB_TOKEN: "ghp_1234567890abcdef1234567890abcdef123456",

// Fake database connection string
DATABASE_URL: "postgresql://testuser:fakepassword123@localhost:5432/testdb",

// Fake JWT secret
JWT_SECRET: "super-secret-jwt-key-that-should-not-be-here-12345",

// Fake Google API key
GOOGLE_API_KEY: "AIzaSyDemoKey1234567890abcdefghijklmnop",

// Fake Slack webhook
SLACK_WEBHOOK: "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
};

// This is intentionally bad practice - hardcoded secrets in source code
const hardcodedPassword = "admin123password";
const apiEndpoint = `https://api.example.com/v1/data?key=sk_live_fake123456789`;

console.log("Demo secrets loaded - these would be detected by TruffleHog");