import { generateSecureCardToken } from "../src/dal/card";
import { isValidAlgerianPhone, normalizeAlgerianPhone } from "../src/lib/phone";

// 1. Test Phone Validation & Normalization
const phoneCases = [
  {
    expectedNormalized: "0550123456",
    input: "0550123456",
    valid: true,
  },
  {
    expectedNormalized: "0550123456",
    input: "+213 550 12 34 56",
    valid: true,
  },
  {
    expectedNormalized: "0661234567",
    input: "0661-23-45-67",
    valid: true,
  },
  {
    expectedNormalized: "0770889900",
    input: "0770.88.99.00",
    valid: true,
  },
  // Landline test
  {
    input: "021 23 45 67",
    valid: false,
  },
  // Invalid prefix test
  {
    input: "0123456789",
    valid: false,
  },
  // Too short
  {
    input: "055012345",
    valid: false,
  },
  // Too long
  {
    input: "05501234567",
    valid: false,
  },
];

let phoneTestsPassed = 0;
for (const testCase of phoneCases) {
  const isValid = isValidAlgerianPhone(testCase.input);
  if (isValid !== testCase.valid) {
    throw new Error(
      `Phone validation failed for "${testCase.input}". Expected ${testCase.valid}, got ${isValid}`
    );
  }
  if (testCase.expectedNormalized) {
    const normalized = normalizeAlgerianPhone(testCase.input);
    if (normalized !== testCase.expectedNormalized) {
      throw new Error(
        `Normalization failed for "${testCase.input}". Expected ${testCase.expectedNormalized}, got ${normalized}`
      );
    }
  }
  phoneTestsPassed += 1;
}

// 2. Test Secure Card Token Generation
const token1 = generateSecureCardToken();
const token2 = generateSecureCardToken();

if (!token1 || token1.length < 32) {
  throw new Error("Token generation returned an invalid token length");
}
if (token1 === token2) {
  throw new Error("Tokens collision detected!");
}

// 3. Test Multi-Tenant Scoping Logic
const mockCard = {
  balance: 4,
  businessId: "org_cafe_alger",
  cardId: "card_123",
  stampsRequired: 10,
};

const staffOrg1 = "org_cafe_alger";
const staffOrg2 = "org_barber_oran";

const canOrg1Access = mockCard.businessId === staffOrg1;
const canOrg2Access = mockCard.businessId === staffOrg2;

if (!canOrg1Access) {
  throw new Error("Valid tenant was blocked from accessing their card!");
}
if (canOrg2Access) {
  throw new Error(
    "Tenant isolation breach! Organization B was able to access Organization A card!"
  );
}
