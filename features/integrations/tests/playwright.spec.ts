import { test, expect, describe } from 'bun:test';
import { facet, FacetCoverageReporter } from '../../../src/integrations/playwright.js';

describe('Playwright Annotation Helper', () => {
  // @facet product:playwright-annotation-helper
  test('returns Playwright-compatible annotation object', () => {
    const annotation = facet('product:feature-one');
    expect(annotation).toHaveProperty('type');
    expect(annotation).toHaveProperty('description');
    expect(annotation.type).toBe('facet-coverage');
  });

  // @facet product:playwright-annotation-helper
  test('supports single facet ID', () => {
    const annotation = facet('product:feature-one');
    expect(annotation.description).toBe('product:feature-one');
  });

  // @facet product:playwright-annotation-helper
  test('supports multiple facet IDs', () => {
    const annotation = facet('product:feature-one', 'compliance:security', 'dx:usability');
    expect(annotation.description).toContain('product:feature-one');
    expect(annotation.description).toContain('compliance:security');
    expect(annotation.description).toContain('dx:usability');
  });

  // @facet dx:annotation-syntax
  test('facet IDs are comma-separated in description', () => {
    const annotation = facet('a', 'b', 'c');
    expect(annotation.description).toBe('a,b,c');
  });
});

describe('Playwright Reporter', () => {
  // @facet product:playwright-reporter
  test('implements Playwright Reporter interface', () => {
    const reporter = new FacetCoverageReporter();
    expect(typeof reporter.onBegin).toBe('function');
    expect(typeof reporter.onTestEnd).toBe('function');
    expect(typeof reporter.onEnd).toBe('function');
  });

  // @facet product:playwright-reporter
  test('accepts configuration via constructor', () => {
    const reporter = new FacetCoverageReporter({
      output: {
        dir: '.custom-coverage',
        formats: ['json']
      }
    });
    // Should not throw
    expect(reporter).toBeDefined();
  });

  // @facet dx:integration-simplicity
  test('works with minimal configuration', () => {
    const reporter = new FacetCoverageReporter();
    expect(reporter).toBeDefined();
  });

  // @facet dx:integration-simplicity
  test('has clear import path', async () => {
    // This test verifies the import works
    const module = await import('../../../src/integrations/playwright.js');
    expect(module.facet).toBeDefined();
    expect(module.FacetCoverageReporter).toBeDefined();
  });
});

describe('Annotation Syntax', () => {
  // @facet dx:annotation-syntax
  test('annotation feels natural in test code', () => {
    // Demonstrating the syntax
    const testConfig = {
      annotation: facet('product:checkout-flow', 'compliance:pci-dss')
    };

    expect(testConfig.annotation.type).toBe('facet-coverage');
    expect(testConfig.annotation.description).toContain('product:checkout-flow');
  });

  // @facet dx:annotation-syntax
  test('clear separation between annotation and test logic', () => {
    // The facet() function only creates an annotation object
    // It doesn't interfere with test execution
    const annotation = facet('test:facet');
    expect(typeof annotation).toBe('object');
    expect(Object.keys(annotation)).toEqual(['type', 'description']);
  });
});
