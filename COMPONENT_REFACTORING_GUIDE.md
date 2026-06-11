# Component Refactoring Guide

## Overview

This guide documents the refactoring process for large components (>300 lines) in the MES system. The goal is to improve code quality, maintainability, and performance through component decomposition.

## Refactoring Principles

### 1. Single Responsibility Principle
Each component should have one clear purpose and do it well.

### 2. Component Composition
Break large components into smaller, focused sub-components that can be composed together.

### 3. Performance Optimization
Use React.memo, useMemo, and useCallback appropriately to prevent unnecessary re-renders.

### 4. Type Safety
Maintain full TypeScript support with proper type definitions.

### 5. Maintainability
Improve code organization and readability for easier development and debugging.

## Component Size Guidelines

- **Target Size**: <300 lines per component
- **Hard Limit**: 400 lines (require refactoring)
- **Sub-component Size**: 50-150 lines ideal

## Common Component Patterns

### Pattern 1: List Component Structure
```
MainComponent (~150 lines)
├── SearchAndFilterComponent (~80 lines)
├── StatisticsComponent (~60 lines)
├── TableComponent (~120 lines)
│   ├── ColumnsConfiguration (~80 lines)
│   └── RowActionsComponent (~70 lines)
├── BatchActionsComponent (~60 lines)
└── Modal/Drawer Components (imported)
```

### Pattern 2: Form Component Structure
```
FormComponent (~200 lines)
├── FormFieldsConfiguration (~100 lines)
├── FormValidation (~50 lines)
└── FormActions (~50 lines)
```

### Pattern 3: Dashboard Component Structure
```
DashboardComponent (~250 lines)
├── StatisticsCardsComponent (~100 lines)
├── ChartsComponent (~150 lines)
└── RecentActivityComponent (~100 lines)
```

## Performance Optimization Techniques

### 1. Memoization Strategies

```typescript
// Use React.memo for pure components
export const Component = React.memo(({ prop1, prop2 }) => {
  // Component logic
});

// Use useMemo for expensive computations
const expensiveValue = useMemo(() => {
  return heavyComputation(data);
}, [data]);

// Use useCallback for event handlers
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

### 2. Component Props Optimization

```typescript
// Avoid inline functions in JSX
// Bad
<Component onClick={() => handleSomething()} />

// Good
const handleClick = useCallback(() => {
  handleSomething();
}, [handleSomething]);
<Component onClick={handleClick} />
```

### 3. State Management

```typescript
// Keep state as close to where it's used as possible
// Lift state only when necessary for sharing between components
```

## Code Organization

### 1. File Structure
```
module/
├── components/
│   ├── MainList.tsx          # Main component <300 lines
│   ├── ListSearch.tsx        # Search functionality <100 lines
│   ├── ListStatistics.tsx    # Statistics display <80 lines
│   ├── ListTable.tsx         # Table configuration <150 lines
│   ├── ListActions.tsx       # Row actions <100 lines
│   ├── BatchActions.tsx      # Batch operations <80 lines
│   └── forms/
│       ├── CreateModal.tsx   # Creation form <200 lines
│       ├── EditModal.tsx     # Edit form <200 lines
│       └── DetailDrawer.tsx  # Detail view <150 lines
```

### 2. Export Patterns
```typescript
// Named exports for components
export const MainList: React.FC<Props> = () => { ... };

// Default export for main component
export default MainList;

// Internal components (not exported)
const SubComponent: React.FC = () => { ... };
```

## Testing Strategies

### 1. Unit Testing
```typescript
// Test each sub-component independently
describe('EmployeeSearchAndFilter', () => {
  it('renders search input correctly', () => {
    // Test implementation
  });

  it('calls onSearch when search button clicked', () => {
    // Test implementation
  });
});
```

### 2. Integration Testing
```typescript
// Test component composition
describe('EmployeeList', () => {
  it('renders all sub-components correctly', () => {
    // Test implementation
  });
});
```

## Common Anti-Patterns to Avoid

### 1. God Components
**Bad**: One component doing everything (search, filter, table, actions, modals)
**Good**: Split into focused sub-components

### 2. Prop Drilling
**Bad**: Passing props through many intermediate components
**Good**: Use context or state management (Zustand) for shared state

### 3. Inline Functions
**Bad**: Defining functions inline in JSX
**Good**: Use useCallback for stable function references

### 4. Unnecessary Re-renders
**Bad**: Large components re-rendering frequently
**Good**: Use React.memo and proper dependency arrays

## Refactoring Checklist

Before Refactoring:
- [ ] Identify component responsibilities
- [ ] Analyze component size and complexity
- [ ] Identify potential sub-components
- [ ] Review dependencies and state usage

During Refactoring:
- [ ] Extract focused sub-components
- [ ] Apply performance optimizations
- [ ] Maintain type safety
- [ ] Preserve functionality
- [ ] Update imports and exports

After Refactoring:
- [ ] Test all functionality
- [ ] Verify performance improvements
- [ ] Update documentation
- [ ] Code review

## Code Review Checklist

- [ ] Component size <300 lines
- [ ] Single responsibility principle followed
- [ ] Proper memoization applied
- [ ] Type safety maintained
- [ ] No prop drilling
- [ ] Clear component hierarchy
- [ ] Good separation of concerns
- [ ] Tests updated

## Monitoring and Maintenance

### 1. Component Size Monitoring
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'max-lines-per-function': ['error', { max: 50, skipBlankLines: true }],
    'max-lines': ['warn', { max: 300, skipComments: true }],
    'complexity': ['warn', { max: 10 }],
    'max-depth': ['error', { max: 3 }],
  }
};
```

### 2. Regular Review Process
- Monthly component size audit
- Performance metrics tracking
- Code quality score monitoring

## Examples

### Example 1: Search and Filter Component
```typescript
import React, { useCallback } from 'react';
import { Input, Select, Button, Space } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

interface SearchAndFilterProps {
  onSearch: (query: string) => void;
  onFilter: (filters: Filters) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  onSearch,
  onFilter,
  onRefresh,
  loading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();

  const handleSearch = useCallback(() => {
    onSearch(searchQuery);
  }, [searchQuery, onSearch]);

  const handleFilter = useCallback(() => {
    onFilter({ status: filterStatus });
  }, [filterStatus, onFilter]);

  return (
    <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
      <Input
        placeholder="Search..."
        prefix={<SearchOutlined />}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onPressEnter={handleSearch}
        allowClear
      />
      <Select
        placeholder="Filter by status"
        value={filterStatus}
        onChange={setFilterStatus}
        style={{ width: 120 }}
        allowClear
      >
        <Select.Option value="ACTIVE">Active</Select.Option>
        <Select.Option value="INACTIVE">Inactive</Select.Option>
      </Select>
      <Button onClick={handleFilter}>Filter</Button>
      <Button
        icon={<ReloadOutlined />}
        onClick={onRefresh}
        loading={loading}
      >
        Refresh
      </Button>
    </Space.Compact>
  );
};
```

### Example 2: Statistics Component
```typescript
import React, { useMemo } from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { UserOutlined, CheckCircleOutlined } from '@ant-design/icons';

interface StatisticsProps {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
}

export const Statistics: React.FC<StatisticsProps> = ({
  totalCount,
  activeCount,
  inactiveCount,
}) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Total"
            value={totalCount}
            prefix={<UserOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Active"
            value={activeCount}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Inactive"
            value={inactiveCount}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Card>
      </Col>
    </Row>
  );
};
```

### Example 3: Row Actions Component
```typescript
import React from 'react';
import { Button, Space, Dropdown } from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
} from '@ant-design/icons';

interface RowActionsProps<T> {
  record: T;
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onView: (record: T) => void;
  onEdit: (record: T) => void;
  onDelete: (record: T) => void;
}

export const RowActions = <T extends { id: string }>({
  record,
  canView = true,
  canEdit = true,
  canDelete = true,
  onView,
  onEdit,
  onDelete,
}: RowActionsProps<T>) => {
  const actions = [
    { key: 'view', label: 'View', icon: <EyeOutlined />, onClick: () => onView(record) },
  ];

  if (canEdit) {
    actions.push({ key: 'edit', label: 'Edit', icon: <EditOutlined />, onClick: () => onEdit(record) });
  }

  if (canDelete) {
    actions.push({ key: 'delete', label: 'Delete', icon: <DeleteOutlined />, onClick: () => onDelete(record), danger: true });
  }

  if (actions.length <= 3) {
    return (
      <Space size="small">
        {actions.map(action => (
          <Button
            key={action.key}
            type="link"
            size="small"
            icon={action.icon}
            onClick={action.onClick}
            danger={action.danger}
          >
            {action.label}
          </Button>
        ))}
      </Space>
    );
  }

  const menuItems = actions.slice(2).map(action => ({
    key: action.key,
    label: action.label,
    icon: action.icon,
    onClick: action.onClick,
    danger: action.danger,
  }));

  return (
    <Space size="small">
      {actions.slice(0, 2).map(action => (
        <Button
          key={action.key}
          type="link"
          size="small"
          icon={action.icon}
          onClick={action.onClick}
          danger={action.danger}
        >
          {action.label}
        </Button>
      ))}
      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
        <Button type="link" size="small" icon={<MoreOutlined />}>
          More
        </Button>
      </Dropdown>
    </Space>
  );
};
```

## Migration Plan

### Phase 1: Analysis (Week 1)
- Identify all components >300 lines
- Create refactoring backlog
- Prioritize by impact and usage

### Phase 2: Pilot (Week 2)
- Refactor 2-3 critical components
- Validate refactoring approach
- Document lessons learned

### Phase 3: Implementation (Weeks 3-6)
- Refactor remaining large components
- Apply performance optimizations
- Update tests

### Phase 4: Validation (Week 7)
- Test all refactored components
- Performance benchmarking
- Code review and quality checks

### Phase 5: Maintenance (Ongoing)
- Regular component size monitoring
- Continuous improvement
- Knowledge sharing

## Success Metrics

- Component size: Average 450 lines → <300 lines (33% reduction)
- Maintainability score: Improved by 40%
- Test coverage: Increased by 25%
- Performance: Reduced re-renders by 30%
- Developer satisfaction: Improved onboarding experience

## Resources

- React Performance Optimization Guide
- Component Design Patterns
- TypeScript Best Practices
- Testing Guidelines

---

This guide should be updated regularly as we learn from the refactoring process and discover new best practices.