-- Migration: Remove Eclipse Correlation module
-- Date: 2025-11-18
-- Description: Remove EclipseCorrelation table and related references

-- Drop the EclipseCorrelation table
DROP TABLE IF EXISTS "EclipseCorrelation" CASCADE;

-- Remove the correlations reference from EclipseDetection
-- (This is already done in schema.prisma, migration handles DB)
