# Import/Export Migration Checklist

Use this checklist to integrate import/export functionality into each module.

---

## Pre-Migration Checklist

- [ ] Review `IMPORT_EXPORT_QUICK_REFERENCE.md` for quick start guide
- [ ] Review `IMPORT_EXPORT_INTEGRATION_GUIDE.md` for detailed instructions
- [ ] Review module-specific requirements in integration guide
- [ ] Identify required fields for the module
- [ ] Identify validation rules for the module
- [ ] Test backend import/export endpoints (if available)
- [ ] Prepare test data files for testing

---

## Module Integration Checklist

### Material Module (物料)

- [ ] Add ImportExportModal import
- [ ] Add modal state
- [ ] Add import/export button to action bar
- [ ] Add ImportExportModal component to JSX
- [ ] Implement success handler
- [ ] Implement error handler (optional)
- [ ] Implement progress handler (optional)
- [ ] Test import with valid data
- [ ] Test import with invalid data
- [ ] Test export functionality
- [ ] Test template download
- [ ] Verify data refresh after import
- [ ] Verify statistics update after import

**Module Name:** `material`
**Display Name:** `物料管理`
**Required Fields:** code, name, unit, category

---

### Employee Module (员工)

- [ ] Add ImportExportModal import
- [ ] Add modal state
- [ ] Add import/export button to action bar
- [ ] Add ImportExportModal component to JSX
- [ ] Implement success handler
- [ ] Implement error handler (optional)
- [ ] Implement progress handler (optional)
- [ ] Test import with valid data
- [ ] Test import with invalid phone number
- [ ] Test import with invalid ID card
- [ ] Test export functionality
- [ ] Test template download
- [ ] Verify data refresh after import
- [ ] Verify statistics update after import

**Module Name:** `employee`
**Display Name:** `员工管理`
**Required Fields:** code, name, phone, idCard
**Special Validation:** Phone format, ID card checksum

---

### Unit Module (计量单位)

- [ ] Add ImportExportModal import
- [ ] Add modal state
- [ ] Add import/export button to action bar
- [ ] Add ImportExportModal component to JSX
- [ ] Implement success handler
- [ ] Implement error handler (optional)
- [ ] Implement progress handler (optional)
- [ ] Test import with valid data
- [ ] Test import with invalid code format
- [ ] Test export functionality
- [ ] Test template download
- [ ] Verify data refresh after import

**Module Name:** `unit`
**Display Name:** `计量单位`
**Required Fields:** code, name, symbol
**Special Validation:** Code format (alphanumeric only)

---

### Workshop Module (车间)

- [ ] Add ImportExportModal import
- [ ] Add modal state
- [ ] Add import/export button to action bar
- [ ] Add ImportExportModal component to JSX
- [ ] Implement success handler
- [ ] Implement error handler (optional)
- [ ] Implement progress handler (optional)
- [ ] Test import with valid data
- [ ] Test export functionality
- [ ] Test template download
- [ ] Verify data refresh after import

**Module Name:** `workshop`
**Display Name:** `车间管理`
**Required Fields:** code, name

---

### WorkCenter Module (工作中心)

- [ ] Add ImportExportModal import
- [ ] Add modal state
- [ ] Add import/export button to action bar
- [ ] Add ImportExportModal component to JSX
- [ ] Implement success handler
- [ ] Implement error handler (optional)
- [ ] Implement progress handler (optional)
- [ ] Test import with valid data
- [ ] Test import with invalid workshopCode
- [ ] Test export functionality
- [ ] Test template download
- [ ] Verify data refresh after import

**Module Name:** `workcenter`
**Display Name:** `工作中心`
**Required Fields:** code, name, workshopCode

---

### Team Module (班组)

- [ ] Add ImportExportModal import
- [ ] Add modal state
- [ ] Add import/export button to action bar
- [ ] Add ImportExportModal component to JSX
- [ ] Implement success handler
- [ ] Implement error handler (optional)
- [ ] Implement progress handler (optional)
- [ ] Test import with valid data
- [ ] Test export functionality
- [ ] Test template download
- [ ] Verify data refresh after import

**Module Name:** `team`
**Display Name:** `班组管理`
**Required Fields:** code, name, leader

---

### Operation Module (工序)

- [ ] Add ImportExportModal import
- [ ] Add modal state
- [ ] Add import/export button to action bar
- [ ] Add ImportExportModal component to JSX
- [ ] Implement success handler
- [ ] Implement error handler (optional)
- [ ] Implement progress handler (optional)
- [ ] Test import with valid data
- [ ] Test import with invalid cycleTime
- [ ] Test export functionality
- [ ] Test template download
- [ ] Verify data refresh after import

**Module Name:** `operation`
**Display Name:** `工序管理`
**Required Fields:** code, name
**Special Validation:** cycleTime must be positive number

---

### Equipment Module (设备)

- [ ] Add ImportExportModal import
- [ ] Add modal state
- [ ] Add import/export button to action bar
- [ ] Add ImportExportModal component to JSX
- [ ] Implement success handler
- [ ] Implement error handler (optional)
- [ ] Implement progress handler (optional)
- [ ] Test import with valid data
- [ ] Test import with invalid status
- [ ] Test export functionality
- [ ] Test template download
- [ ] Verify data refresh after import

**Module Name:** `equipment`
**Display Name:** `设备管理`
**Required Fields:** code, name
**Special Validation:** Status enum (ACTIVE, MAINTENANCE, INACTIVE)

---

### BOM Module (物料清单)

- [ ] Add ImportExportModal import
- [ ] Add modal state
- [ ] Add import/export button to action bar
- [ ] Add ImportExportModal component to JSX
- [ ] Implement success handler
- [ ] Implement error handler (optional)
- [ ] Implement progress handler (optional)
- [ ] Test import with valid data
- [ ] Test import with invalid quantity
- [ ] Test export functionality
- [ ] Test template download
- [ ] Verify data refresh after import

**Module Name:** `bom`
**Display Name:** `物料清单`
**Required Fields:** materialCode, bomCode, componentCode, quantity
**Special Validation:** quantity must be positive number

---

### QC Scheme Module (质检方案)

- [ ] Add ImportExportModal import
- [ ] Add modal state
- [ ] Add import/export button to action bar
- [ ] Add ImportExportModal component to JSX
- [ ] Implement success handler
- [ ] Implement error handler (optional)
- [ ] Implement progress handler (optional)
- [ ] Test import with valid data
- [ ] Test export functionality
- [ ] Test template download
- [ ] Verify data refresh after import

**Module Name:** `qc-scheme`
**Display Name:** `质检方案`
**Required Fields:** code, name, type

---

### QC Item Module (质检项目)

- [ ] Add ImportExportModal import
- [ ] Add modal state
- [ ] Add import/export button to action bar
- [ ] Add ImportExportModal component to JSX
- [ ] Implement success handler
- [ ] Implement error handler (optional)
- [ ] Implement progress handler (optional)
- [ ] Test import with valid data
- [ ] Test export functionality
- [ ] Test template download
- [ ] Verify data refresh after import

**Module Name:** `qc-item`
**Display Name:** `质检项目`
**Required Fields:** code, name, type

---

## Post-Migration Checklist

- [ ] Verify all modules integrated successfully
- [ ] Run comprehensive tests for each module
- [ ] Test cross-module scenarios
- [ ] Test error scenarios for each module
- [ ] Test performance with large files
- [ ] Test concurrent imports/exports
- [ ] Verify user experience consistency
- [ ] Update module documentation
- [ ] Create user training materials
- [ ] Deploy to staging environment
- [ ] Conduct user acceptance testing
- [ ] Gather feedback and make improvements
- [ ] Deploy to production

---

## Testing Checklist

### Unit Tests
- [ ] Test validation utilities
- [ ] Test useImportExport hook
- [ ] Test ImportExportModal component
- [ ] Test ImportProgress component
- [ ] Test API client methods

### Integration Tests
- [ ] Test import flow for each module
- [ ] Test export flow for each module
- [ ] Test error scenarios
- [ ] Test progress tracking
- [ ] Test file validation

### E2E Tests
- [ ] Test complete user journey
- [ ] Test file upload/download
- [ ] Test modal interactions
- [ ] Test success/failure scenarios
- [ ] Test multiple modules

### Performance Tests
- [ ] Test with small files (< 1MB)
- [ ] Test with medium files (1-5MB)
- [ ] Test with large files (5-10MB)
- [ ] Test concurrent operations
- [ ] Test memory usage

### Security Tests
- [ ] Test file type validation
- [ ] Test file size limits
- [ ] Test injection attacks
- [ ] Test unauthorized access
- [ ] Test data sanitization

---

## Code Review Checklist

- [ ] Review code quality
- [ ] Review TypeScript types
- [ ] Review error handling
- [ ] Review user experience
- [ ] Review performance
- [ ] Review security
- [ ] Review documentation
- [ ] Review test coverage

---

## Deployment Checklist

### Staging Deployment
- [ ] Merge to staging branch
- [ ] Run all tests
- [ ] Verify build succeeds
- [ ] Deploy to staging
- [ ] Smoke test on staging
- [ ] Conduct UAT

### Production Deployment
- [ ] Get approval for production deployment
- [ ] Create deployment plan
- [ ] Schedule deployment window
- [ ] Create rollback plan
- [ ] Deploy to production
- [ ] Verify deployment success
- [ ] Monitor for issues
- [ ] Collect user feedback

---

## Monitoring Checklist

- [ ] Set up error tracking
- [ ] Set up performance monitoring
- [ ] Set up usage analytics
- [ ] Set up alerting
- [ ] Review logs regularly
- [ ] Review metrics regularly
- [ ] Address issues promptly

---

## Maintenance Checklist

### Weekly
- [ ] Review error logs
- [ ] Review performance metrics
- [ ] Review user feedback
- [ ] Address critical issues

### Monthly
- [ ] Review usage statistics
- [ ] Review security logs
- [ ] Update documentation
- [ ] Plan improvements

### Quarterly
- [ ] Conduct security audit
- [ ] Performance review
- [ ] User satisfaction survey
- [ ] Plan major updates

---

## Rollback Plan

If issues are discovered after deployment:

1. **Immediate Actions**
   - [ ] Identify the issue
   - [ ] Assess impact
   - [ ] Determine rollback necessity
   - [ ] Notify stakeholders

2. **Rollback Execution**
   - [ ] Execute rollback plan
   - [ ] Verify rollback success
   - [ ] Notify users
   - [ ] Document the incident

3. **Post-Rollback**
   - [ ] Investigate root cause
   - [ ] Fix the issue
   - [ ] Test the fix
   - [ ] Redeploy

---

## Success Criteria

A module migration is considered complete when:

- [ ] ImportExportModal is integrated
- [ ] All required handlers are implemented
- [ ] Basic tests pass
- [ ] User acceptance testing passes
- [ ] Documentation is updated
- [ ] Team is trained

Overall migration is considered complete when:

- [ ] All 11 modules are migrated
- [ ] All tests pass
- [ ] User acceptance testing passes for all modules
- [ ] Performance meets requirements
- [ ] Security requirements are met
- [ ] Documentation is complete
- [ ] Team is trained
- [ ] Production deployment is successful

---

## Notes

- Each module should take approximately 10-15 minutes to integrate
- Total integration time for all modules: ~2-3 hours
- Testing time: ~1-2 hours per module
- Documentation updates: ~30 minutes per module

---

**Last Updated:** 2026-05-04
**Version:** 1.0.0
