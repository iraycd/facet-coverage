import { test, expect, describe } from 'bun:test';
import { facet as playwrightFacet, FacetCoverageReporter } from '../../../src/integrations/playwright.js';
import { Facets, facet } from '../.facet/facets';

describe('Playwright Annotation Helper', () => {
  test('returns Playwright-compatible annotation object', () => {
    facet(Facets.FEATURES_INTEGRATIONS_PRODUCT_PLAYWRIGHT_ANNOTATION_HELPER);

    const annotation = playwrightFacet('product:feature-one');
    expect(annotation).toHaveProperty('type');
    expect(annotation).toHaveProperty('description');
    expect(annotation.type).toBe('facet-coverage');
  });

  test('supports single facet ID', () => {
    facet(Facets.FEATURES_INTEGRATIONS_PRODUCT_PLAYWRIGHT_ANNOTATION_HELPER);

    const annotation = playwrightFacet('product:feature-one');
    expect(annotation.description).toBe('product:feature-one');
  });

  test('supports multiple facet IDs', () => {
    facet(Facets.FEATURES_INTEGRATIONS_PRODUCT_PLAYWRIGHT_ANNOTATION_HELPER);

    const annotation = playwrightFacet('product:feature-one', 'compliance:security', 'dx:usability');
    expect(annotation.description).toContain('product:feature-one');
    expect(annotation.description).toContain('compliance:security');
    expect(annotation.description).toContain('dx:usability');
  });

  test('facet IDs are comma-separated in description', () => {
    facet(Facets.FEATURES_INTEGRATIONS_DX_ANNOTATION_SYNTAX);

    const annotation = playwrightFacet('a', 'b', 'c');
    expect(annotation.description).toBe('a,b,c');
  });
});

describe('Playwright Reporter', () => {
  test('implements Playwright Reporter interface', () => {
    facet(Facets.FEATURES_INTEGRATIONS_PRODUCT_PLAYWRIGHT_REPORTER);

    const reporter = new FacetCoverageReporter();
    expect(typeof reporter.onBegin).toBe('function');
    expect(typeof reporter.onTestEnd).toBe('function');
    expect(typeof reporter.onEnd).toBe('function');
  });

  test('accepts configuration via constructor', () => {
    facet(Facets.FEATURES_INTEGRATIONS_PRODUCT_PLAYWRIGHT_REPORTER);

    const reporter = new FacetCoverageReporter({
      output: {
        dir: '.custom-coverage',
        formats: ['json']
      }
    });
    // Should not throw
    expect(reporter).toBeDefined();
  });

  test('works with minimal configuration', () => {
    facet(Facets.FEATURES_INTEGRATIONS_DX_INTEGRATION_SIMPLICITY);

    const reporter = new FacetCoverageReporter();
    expect(reporter).toBeDefined();
  });

  test('has clear import path', async () => {
    facet(Facets.FEATURES_INTEGRATIONS_DX_INTEGRATION_SIMPLICITY);

    // This test verifies the import works
    const module = await import('../../../src/integrations/playwright.js');
    expect(module.facet).toBeDefined();
    expect(module.FacetCoverageReporter).toBeDefined();
  });
});

describe('Annotation Syntax', () => {
  test('annotation feels natural in test code', () => {
    facet(Facets.FEATURES_INTEGRATIONS_DX_ANNOTATION_SYNTAX);

    // Demonstrating the syntax
    const testConfig = {
      annotation: playwrightFacet('product:checkout-flow', 'compliance:pci-dss')
    };

    expect(testConfig.annotation.type).toBe('facet-coverage');
    expect(testConfig.annotation.description).toContain('product:checkout-flow');
  });

  test('clear separation between annotation and test logic', () => {
    facet(Facets.FEATURES_INTEGRATIONS_DX_ANNOTATION_SYNTAX);

    // The facet() function only creates an annotation object
    // It doesn't interfere with test execution
    const annotation = playwrightFacet('test:facet');
    expect(typeof annotation).toBe('object');
    // Unified return type has type, description for Playwright and facets, toString for generic usage
    expect(annotation).toHaveProperty('type');
    expect(annotation).toHaveProperty('description');
    expect(annotation).toHaveProperty('facets');
    expect(typeof annotation.toString).toBe('function');
  });
});

describe('Unified facet() Return Type', () => {
  test('generated facet() has type and description for Playwright compatibility', () => {
    const annotation = facet(Facets.FEATURES_INTEGRATIONS_PRODUCT_PLAYWRIGHT_ANNOTATION_HELPER);

    // Playwright-compatible properties
    expect(annotation.type).toBe('facet-coverage');
    expect(annotation.description).toBeDefined();
    expect(typeof annotation.description).toBe('string');
  });

  test('generated facet() has facets array and toString for generic usage', () => {
    const annotation = facet(Facets.FEATURES_INTEGRATIONS_PRODUCT_PLAYWRIGHT_ANNOTATION_HELPER);

    // Generic usage properties
    expect(annotation.facets).toBeDefined();
    expect(Array.isArray(annotation.facets)).toBe(true);
    expect(typeof annotation.toString).toBe('function');
  });

  test('generated facet() can be used directly in Playwright test config', () => {
    // Simulating Playwright test configuration
    const testConfig = {
      annotation: facet(Facets.FEATURES_INTEGRATIONS_PRODUCT_PLAYWRIGHT_ANNOTATION_HELPER)
    };

    expect(testConfig.annotation.type).toBe('facet-coverage');
    expect(testConfig.annotation.description).toContain('features/integrations/product:playwright-annotation-helper');
  });

  test('both facet() implementations return matching types', () => {
    const generatedAnnotation = facet(Facets.FEATURES_INTEGRATIONS_PRODUCT_PLAYWRIGHT_ANNOTATION_HELPER);
    const playwrightAnnotation = playwrightFacet('features/integrations/product:playwright-annotation-helper');

    // Both should have the same properties
    expect(generatedAnnotation.type).toBe(playwrightAnnotation.type);
    expect(typeof generatedAnnotation.description).toBe(typeof playwrightAnnotation.description);
    expect(Array.isArray(generatedAnnotation.facets)).toBe(Array.isArray(playwrightAnnotation.facets));
    expect(typeof generatedAnnotation.toString).toBe(typeof playwrightAnnotation.toString);
  });

  test('toString() formats facet IDs correctly', () => {
    const singleAnnotation = playwrightFacet('facet-a');
    const multiAnnotation = playwrightFacet('facet-a', 'facet-b', 'facet-c');

    expect(singleAnnotation.toString()).toBe('facet-a');
    expect(multiAnnotation.toString()).toBe('facet-a, facet-b, facet-c');
  });

  test('description uses comma separator for Playwright parsing', () => {
    const annotation = playwrightFacet('facet-a', 'facet-b', 'facet-c');

    // Description uses comma without spaces (for easier parsing)
    expect(annotation.description).toBe('facet-a,facet-b,facet-c');
  });
});
