import { test, expect, describe } from 'bun:test';
import { facet as playwrightFacet, FacetCoverageReporter } from '../../../src/integrations/playwright.js';
import { Facets, facet } from '../.facet/facets';

describe('Playwright Annotation Helper', () => {
  test('returns Playwright-compatible annotation object', () => {
    facet(Facets.PRODUCT_PLAYWRIGHT_ANNOTATION_HELPER);

    const annotation = playwrightFacet('product:feature-one');
    expect(annotation).toHaveProperty('type');
    expect(annotation).toHaveProperty('description');
    expect(annotation.type).toBe('facet-coverage');
  });

  test('supports single facet ID', () => {
    facet(Facets.PRODUCT_PLAYWRIGHT_ANNOTATION_HELPER);

    const annotation = playwrightFacet('product:feature-one');
    expect(annotation.description).toBe('product:feature-one');
  });

  test('supports multiple facet IDs', () => {
    facet(Facets.PRODUCT_PLAYWRIGHT_ANNOTATION_HELPER);

    const annotation = playwrightFacet('product:feature-one', 'compliance:security', 'dx:usability');
    expect(annotation.description).toContain('product:feature-one');
    expect(annotation.description).toContain('compliance:security');
    expect(annotation.description).toContain('dx:usability');
  });

  test('facet IDs are comma-separated in description', () => {
    facet(Facets.DX_ANNOTATION_SYNTAX);

    const annotation = playwrightFacet('a', 'b', 'c');
    expect(annotation.description).toBe('a,b,c');
  });
});

describe('Playwright Reporter', () => {
  test('implements Playwright Reporter interface', () => {
    facet(Facets.PRODUCT_PLAYWRIGHT_REPORTER);

    const reporter = new FacetCoverageReporter();
    expect(typeof reporter.onBegin).toBe('function');
    expect(typeof reporter.onTestEnd).toBe('function');
    expect(typeof reporter.onEnd).toBe('function');
  });

  test('accepts configuration via constructor', () => {
    facet(Facets.PRODUCT_PLAYWRIGHT_REPORTER);

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
    facet(Facets.DX_INTEGRATION_SIMPLICITY);

    const reporter = new FacetCoverageReporter();
    expect(reporter).toBeDefined();
  });

  test('has clear import path', async () => {
    facet(Facets.DX_INTEGRATION_SIMPLICITY);

    // This test verifies the import works
    const module = await import('../../../src/integrations/playwright.js');
    expect(module.facet).toBeDefined();
    expect(module.FacetCoverageReporter).toBeDefined();
  });
});

describe('Annotation Syntax', () => {
  test('annotation feels natural in test code', () => {
    facet(Facets.DX_ANNOTATION_SYNTAX);

    // Demonstrating the syntax
    const testConfig = {
      annotation: playwrightFacet('product:checkout-flow', 'compliance:pci-dss')
    };

    expect(testConfig.annotation.type).toBe('facet-coverage');
    expect(testConfig.annotation.description).toContain('product:checkout-flow');
  });

  test('clear separation between annotation and test logic', () => {
    facet(Facets.DX_ANNOTATION_SYNTAX);

    // The facet() function only creates an annotation object
    // It doesn't interfere with test execution
    const annotation = playwrightFacet('test:facet');
    expect(typeof annotation).toBe('object');
    expect(Object.keys(annotation)).toEqual(['type', 'description']);
  });
});
