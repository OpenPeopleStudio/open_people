/**
 * Tenant Resolution Tests
 * 
 * Tests for lib/tenant.ts - the core tenant routing logic.
 */

import { describe, it, expect } from 'vitest';
import { getRouteType } from '@/lib/tenant';

describe('getRouteType', () => {
  describe('marketing routes', () => {
    it('returns marketing for openpeople.ai', () => {
      expect(getRouteType('openpeople.ai')).toBe('marketing');
    });
    
    it('returns marketing for www.openpeople.ai', () => {
      expect(getRouteType('www.openpeople.ai')).toBe('marketing');
    });
    
    it('returns marketing for localhost without prefix', () => {
      expect(getRouteType('localhost')).toBe('marketing');
      expect(getRouteType('localhost:3000')).toBe('marketing');
    });
  });
  
  describe('super-admin routes', () => {
    it('returns super-admin for app.openpeople.ai', () => {
      expect(getRouteType('app.openpeople.ai')).toBe('super-admin');
    });
    
    it('returns super-admin for app.localhost', () => {
      expect(getRouteType('app.localhost')).toBe('super-admin');
      expect(getRouteType('app.localhost:3000')).toBe('super-admin');
    });
    
    it('returns super-admin for super.localhost', () => {
      expect(getRouteType('super.localhost')).toBe('super-admin');
      expect(getRouteType('super.localhost:3000')).toBe('super-admin');
    });
  });
  
  describe('tenant routes', () => {
    it('returns tenant for subdomain.openpeople.ai', () => {
      expect(getRouteType('demo.openpeople.ai')).toBe('tenant');
      expect(getRouteType('acme.openpeople.ai')).toBe('tenant');
    });
    
    it('returns tenant for mars.openpeople.ai (internal workspace)', () => {
      // Mars is the Open People internal tenant
      expect(getRouteType('mars.openpeople.ai')).toBe('tenant');
    });
    
    it('returns tenant for subdomain.localhost', () => {
      expect(getRouteType('demo.localhost')).toBe('tenant');
      expect(getRouteType('demo.localhost:3000')).toBe('tenant');
    });
    
    it('returns tenant for mars.localhost (development)', () => {
      expect(getRouteType('mars.localhost')).toBe('tenant');
      expect(getRouteType('mars.localhost:3000')).toBe('tenant');
    });
    
    it('returns tenant for custom domains', () => {
      // Custom domains are treated as tenant routes
      expect(getRouteType('shop.example.com')).toBe('tenant');
      expect(getRouteType('store.mybrand.com')).toBe('tenant');
    });
  });
  
  describe('edge cases', () => {
    it('handles empty host', () => {
      expect(getRouteType('')).toBe('marketing');
    });
    
    it('handles null/undefined host', () => {
      expect(getRouteType(null as unknown as string)).toBe('marketing');
      expect(getRouteType(undefined as unknown as string)).toBe('marketing');
    });
    
    it('is case insensitive', () => {
      expect(getRouteType('APP.openpeople.ai')).toBe('super-admin');
      expect(getRouteType('DEMO.openpeople.ai')).toBe('tenant');
    });
  });
});
