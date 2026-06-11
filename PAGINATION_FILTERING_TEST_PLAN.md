# Pagination and Filtering Test Plan

## Overview
Comprehensive testing of pagination and filtering functionality across all basic data modules in the MES system.

## Test Scope

### Modules to Test
- **Employee Module** (员工模块)
- **Material Module** (物料模块)  
- **Team Module** (班组模块)
- **Equipment Module** (设备模块)
- **Operation Module** (工序模块)
- **Workshop Module** (车间模块)
- **BOM Module** (BOM模块) - Optional secondary focus

### Test Categories

#### 1. Pagination Functionality
- Page switching (next/previous)
- Page size changes (15, 30, 50, 100)
- Direct page navigation (jump to page)
- Pagination state persistence
- Edge cases (empty results, single page, large page numbers)

#### 2. Filtering Functionality
- Single field filtering (name, code, status, etc.)
- Multiple field filtering
- Filter validation and error handling
- Filter reset functionality
- Filter state management

#### 3. Combination Testing
- Pagination + filtering combined
- Filter changes resetting pagination
- Page size changes maintaining filters
- Complex filter scenarios

#### 4. Performance Testing
- Large dataset handling (1000+ records)
- Response time measurements
- Loading state handling
- Memory usage monitoring

#### 5. Edge Cases
- Empty result sets
- Invalid page numbers
- Special characters in filters
- Very long filter values
- Concurrent request handling

## Implementation Analysis

### Architecture Components

#### 1. DataTable Component
**Location**: `src/shared/components/DataTable/index.tsx`

**Key Features**:
- Ant Design Table wrapper
- Built-in pagination controls
- Row selection support
- Loading states
- Custom actions and footer

**Pagination Props**:
```typescript
pagination?: TablePaginationConfig | false;
paginationState?: PaginationState;
onPaginationChange?: (page: number, pageSize: number) => void;
```

#### 2. useTable Hook
**Location**: `src/shared/hooks/useTable.ts`

**Key Features**:
- Unified table data management
- Automatic pagination handling
- Query parameter management
- Loading state management
- Request cancellation (AbortController)

**Pagination State**:
```typescript
interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}
```

#### 3. API Client
**Location**: `src/shared/api/apiClient.ts`

**Key Features**:
- Request caching
- Performance monitoring
- Error handling
- Request cancellation

#### 4. SearchForm Component
**Location**: `src/shared/components/SearchForm/index.tsx`

**Key Features**:
- Dynamic form field rendering
- Filter validation
- Reset functionality
- Multiple input types

### Module-Specific Implementations

#### Employee Module
**Store**: `src/modules/basic-data/employee/store/employeeStore.ts`
**Component**: `src/modules/basic-data/employee/components/EmployeeList.tsx`

**Filter Fields**:
- name (姓名)
- code (工号)  
- role (角色)
- status (状态)
- teamId (班组)

**Pagination**: Uses card-based layout with custom pagination

#### Material Module
**Store**: `src/modules/basic-data/material/store/materialStore.ts`
**Component**: `src/modules/basic-data/material/components/MaterialList.tsx`

**Filter Fields**:
- code (物料编码)
- name (物料名称)
- status (状态)
- categoryId (物料分类)

**Pagination**: Standard DataTable with full pagination controls

#### Team Module
**Store**: `src/modules/basic-data/team/store/teamStore.ts`
**Component**: `src/modules/basic-data/team/components/TeamList.tsx`

**Filter Fields**:
- name (班组名称)
- workCenter (工作中心)
- workshop (车间)
- leader (班组长)
- status (状态)

**Pagination**: Standard DataTable with full pagination controls

#### Equipment Module
**Store**: `src/modules/basic-data/equipment/store/equipmentStore.ts`
**Component**: `src/modules/basic-data/equipment/components/EquipmentList.tsx`

**Filter Fields**:
- equipCode (设备编码)
- equipName (设备名称)
- category (设备类别)
- status (状态)
- workCenter (工作中心)

**Pagination**: Standard DataTable with full pagination controls

#### Operation Module
**Store**: `src/modules/basic-data/operation/store/operationStore.ts`
**Component**: `src/modules/basic-data/operation/components/OperationList.tsx`

**Filter Fields**:
- opCode (工序编码)
- opName (工序名称)
- category (工序类别)
- status (状态)
- workCenter (工作中心)

**Pagination**: Standard DataTable with full pagination controls

#### Workshop Module
**Store**: `src/modules/basic-data/workshop/store/workshopStore.ts`
**Component**: `src/modules/basic-data/workshop/components/WorkshopList.tsx`

**Filter Fields**:
- workShopCode (车间编码)
- workShopName (车间名称)
- type (车间类型)
- status (状态)

**Pagination**: Standard DataTable with full pagination controls

#### BOM Module
**Store**: `src/modules/basic-data/bom/store/bomStore.ts`
**Component**: `src/modules/basic-data/bom/components/BomList.tsx`

**Filter Fields**:
- code (母件编码)
- name (物料名称)
- bomType (BOM类型)
- status (状态)
- createdBy (创建人)

**Pagination**: Standard DataTable with full pagination controls

## Test Scenarios

### 1. Basic Pagination Tests

#### Test 1.1: Page Navigation
- **Objective**: Verify page switching works correctly
- **Steps**:
  1. Load initial page (page 1)
  2. Click "Next" button
  3. Verify page 2 loads
  4. Click "Previous" button
  5. Verify page 1 loads
- **Expected Result**: Page navigation updates data correctly

#### Test 1.2: Page Size Change
- **Objective**: Verify page size changes work correctly
- **Steps**:
  1. Select page size 15 (default)
  2. Change to 30 items per page
  3. Verify more items displayed
  4. Change to 50 items per page
  5. Verify even more items displayed
- **Expected Result**: Page size changes update item count

#### Test 1.3: Direct Page Jump
- **Objective**: Verify direct page navigation works
- **Steps**:
  1. Enter page number 5 in jump input
  2. Press Enter or click jump button
  3. Verify page 5 loads
- **Expected Result**: Direct page jump works correctly

### 2. Filtering Tests

#### Test 2.1: Single Field Filter
- **Objective**: Verify single field filtering works
- **Steps**:
  1. Enter search term in name field
  2. Click search button
  3. Verify filtered results
  4. Clear filter
  5. Verify all results return
- **Expected Result**: Single field filtering works correctly

#### Test 2.2: Status Filter
- **Objective**: Verify status-based filtering works
- **Steps**:
  1. Select "ACTIVE" status from dropdown
  2. Click search
  3. Verify only active items shown
  4. Change to "INACTIVE"
  5. Verify only inactive items shown
- **Expected Result**: Status filtering works correctly

#### Test 2.3: Multiple Field Filters
- **Objective**: Verify combined filtering works
- **Steps**:
  1. Enter name filter
  2. Select status filter
  3. Click search
  4. Verify both filters applied
- **Expected Result**: Multiple filters work together correctly

#### Test 2.4: Filter Reset
- **Objective**: Verify filter reset works
- **Steps**:
  1. Apply multiple filters
  2. Click reset button
  3. Verify all filters cleared
  4. Verify all data shown
- **Expected Result**: Reset clears all filters

### 3. Combination Tests

#### Test 3.1: Filter with Pagination
- **Objective**: Verify filters work across pages
- **Steps**:
  1. Apply filter with multiple pages of results
  2. Navigate to page 2
  3. Verify filtered results on page 2
  4. Navigate to page 3
  5. Verify filtered results on page 3
- **Expected Result**: Filters persist across pages

#### Test 3.2: Filter Reset Page
- **Objective**: Verify filter changes reset to page 1
- **Steps**:
  1. Navigate to page 3
  2. Change filter criteria
  3. Click search
  4. Verify page resets to 1
- **Expected Result**: Filter changes reset pagination

#### Test 3.3: Page Size with Filters
- **Objective**: Verify page size changes maintain filters
- **Steps**:
  1. Apply filter
  2. Change page size from 15 to 50
  3. Verify filter still applied
  4. Verify more items shown with same filter
- **Expected Result**: Page size changes maintain active filters

### 4. Performance Tests

#### Test 4.1: Large Dataset Performance
- **Objective**: Verify performance with 1000+ records
- **Steps**:
  1. Load dataset with 1000+ records
  2. Measure initial load time
  3. Navigate through pages
  4. Measure page change response time
  5. Apply filters
  6. Measure filter response time
- **Expected Result**: Response times < 1 second

#### Test 4.2: Loading States
- **Objective**: Verify loading states display correctly
- **Steps**:
  1. Trigger data load
  2. Verify loading spinner shows
  3. Wait for data to load
  4. Verify loading spinner disappears
- **Expected Result**: Loading states display properly

### 5. Edge Case Tests

#### Test 5.1: Empty Results
- **Objective**: Verify empty result handling
- **Steps**:
  1. Apply filter with no matching results
  2. Verify empty state displayed
  3. Verify appropriate message shown
- **Expected Result**: Empty results handled gracefully

#### Test 5.2: Invalid Page Number
- **Objective**: Verify invalid page handling
- **Steps**:
  1. Enter invalid page number (9999)
  2. Try to navigate
  3. Verify error handling
- **Expected Result**: Invalid page numbers handled gracefully

#### Test 5.3: Special Characters
- **Objective**: Verify special character handling
- **Steps**:
  1. Enter special characters in filter
  2. Click search
  3. Verify proper handling
- **Expected Result**: Special characters handled correctly

## Test Execution Plan

### Phase 1: Manual Testing
Execute each test scenario manually across all modules

### Phase 2: Automated Testing  
Create automated test scripts for repeatable scenarios

### Phase 3: Performance Testing
Run performance benchmarks on large datasets

### Phase 4: Cross-Browser Testing
Test functionality across different browsers

## Success Criteria

### Functional Requirements
- ✅ All pagination controls work correctly
- ✅ All filter fields work as expected
- ✅ Combination scenarios function properly
- ✅ Edge cases handled gracefully
- ✅ Performance meets standards

### Performance Requirements
- Initial page load < 1 second
- Page change response < 500ms
- Filter application < 500ms
- Large dataset handling without performance degradation

### User Experience Requirements
- Clear loading states
- Intuitive pagination controls
- Responsive filter interface
- Proper error handling and feedback

## Reporting Format

### Module Test Results
```
#### [Module Name]
- **Pagination Status**: ✅/❌
- **Filtering Status**: ✅/❌  
- **Performance Notes**: [Performance observations]
- **Issues Found**: [List of any issues]
- **Overall Assessment**: [Summary of module performance]
```

### Summary Report
- Total modules tested: X
- Modules passed pagination: X
- Modules passed filtering: X
- Critical issues: X
- Performance issues: X
- Recommendations: [List of recommendations]

## Next Steps

1. Execute test plan
2. Document findings
3. Create issue tickets for bugs
4. Implement fixes
5. Re-test and verify
6. Create final report
