# 系统管理模块 API 文档

## 基础信息

**基础路径**：`/api`
**认证方式**：待实现
**返回格式**：JSON

## 统一返回格式

### 成功响应
```json
{
  "code": 200,
  "message": "操作成功",
  "data": { ... },
  "total": 0
}
```

### 错误响应
```json
{
  "code": 500,
  "message": "错误信息",
  "data": null,
  "total": 0
}
```

---

## 一、组织架构管理

### 1.1 分页查询组织架构

**接口**：`GET /sys/organization/page`

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| parentId | Long | 否 | 父组织ID |
| orgType | String | 否 | 组织类型：公司/部门/小组 |
| keyword | String | 否 | 搜索关键字（名称/编码） |
| status | Integer | 否 | 状态：1启用 0禁用 |
| page | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页条数，默认20 |

**响应示例**：
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "id": 1,
        "parentId": 0,
        "orgCode": "MDK",
        "orgName": "迈迪康集团",
        "orgType": "公司",
        "leaderId": null,
        "leaderName": "",
        "phone": "",
        "address": "",
        "sortNo": 1,
        "status": 1,
        "createTime": "2026-05-02T10:00:00",
        "updateTime": "2026-05-02T10:00:00",
        "createBy": "",
        "updateBy": ""
      }
    ],
    "total": 9,
    "page": 1,
    "pageSize": 20
  }
}
```

### 1.2 查询组织架构树

**接口**：`GET /sys/organization/tree`

**响应示例**：
```json
{
  "code": 200,
  "message": "操作成功",
  "data": [
    {
      "id": 1,
      "orgName": "迈迪康集团",
      "children": [
        {
          "id": 2,
          "orgName": "制造中心",
          "children": [
            {
              "id": 6,
              "orgName": "生产一部",
              "children": []
            }
          ]
        }
      ]
    }
  ]
}
```

### 1.3 查询子组织树

**接口**：`GET /sys/organization/tree/{parentId}`

**路径参数**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| parentId | Long | 是 | 父组织ID |

### 1.4 根据ID查询组织

**接口**：`GET /sys/organization/{id}`

**路径参数**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Long | 是 | 组织ID |

### 1.5 新增组织

**接口**：`POST /sys/organization`

**请求体**：
```json
{
  "parentId": 0,
  "orgCode": "MDK-HR",
  "orgName": "人力资源部",
  "orgType": "部门",
  "leaderId": null,
  "leaderName": "",
  "phone": "",
  "address": "",
  "sortNo": 5,
  "status": 1
}
```

### 1.6 更新组织

**接口**：`PUT /sys/organization`

**请求体**：
```json
{
  "id": 1,
  "parentId": 0,
  "orgCode": "MDK",
  "orgName": "迈迪康集团",
  "orgType": "公司",
  "sortNo": 1,
  "status": 1
}
```

### 1.7 批量删除组织

**接口**：`DELETE /sys/organization`

**请求体**：
```json
[1, 2, 3]
```

### 1.8 批量更新组织状态

**接口**：`PUT /sys/organization/status`

**请求体**：
```json
{
  "ids": [1, 2, 3],
  "status": 1
}
```

### 1.9 移动组织节点

**接口**：`PUT /sys/organization/move`

**请求体**：
```json
{
  "id": 6,
  "newParentId": 2
}
```

---

## 二、角色管理

### 2.1 分页查询角色

**接口**：`GET /sys/role/page`

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| keyword | String | 否 | 搜索关键字（名称/编码） |
| status | Integer | 否 | 状态：1启用 0禁用 |
| page | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页条数，默认20 |

**响应示例**：
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "id": 1,
        "roleCode": "SUPER_ADMIN",
        "roleName": "超级管理员",
        "description": "系统最高权限，可管理所有功能",
        "sortNo": 1,
        "status": 1,
        "createTime": "2026-05-02T10:00:00",
        "updateTime": "2026-05-02T10:00:00",
        "createBy": "",
        "updateBy": ""
      }
    ],
    "total": 6,
    "page": 1,
    "pageSize": 20
  }
}
```

### 2.2 查询所有角色

**接口**：`GET /sys/role/all`

**响应示例**：
```json
{
  "code": 200,
  "message": "操作成功",
  "data": [
    {
      "id": 1,
      "roleCode": "SUPER_ADMIN",
      "roleName": "超级管理员"
    },
    {
      "id": 2,
      "roleCode": "ADMIN",
      "roleName": "管理员"
    }
  ]
}
```

### 2.3 根据ID查询角色

**接口**：`GET /sys/role/{id}`

### 2.4 新增角色

**接口**：`POST /sys/role`

**请求体**：
```json
{
  "roleCode": "TEST_ROLE",
  "roleName": "测试角色",
  "description": "用于测试的角色",
  "sortNo": 99,
  "status": 1
}
```

### 2.5 更新角色

**接口**：`PUT /sys/role`

**请求体**：
```json
{
  "id": 1,
  "roleCode": "SUPER_ADMIN",
  "roleName": "超级管理员",
  "description": "系统最高权限",
  "sortNo": 1,
  "status": 1
}
```

### 2.6 批量删除角色

**接口**：`DELETE /sys/role`

**请求体**：`[1, 2, 3]`

### 2.7 批量更新角色状态

**接口**：`PUT /sys/role/status`

**请求体**：
```json
{
  "ids": [1, 2, 3],
  "status": 1
}
```

### 2.8 为角色分配权限

**接口**：`PUT /sys/role/{roleId}/permissions`

**路径参数**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| roleId | Long | 是 | 角色ID |

**请求体**：
```json
[1, 2, 3, 11, 12, 13]
```

### 2.9 查询角色的权限列表

**接口**：`GET /sys/role/{roleId}/permissions`

**响应示例**：
```json
{
  "code": 200,
  "message": "操作成功",
  "data": [1, 2, 3, 11, 12, 13]
}
```

---

## 三、权限管理

### 3.1 分页查询权限

**接口**：`GET /sys/permission/page`

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| parentId | Long | 否 | 父权限ID |
| permType | String | 否 | 权限类型：MENU/BUTTON/DATA |
| keyword | String | 否 | 搜索关键字（名称/编码） |
| status | Integer | 否 | 状态：1启用 0禁用 |
| page | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页条数，默认20 |

**响应示例**：
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "id": 1,
        "parentId": 0,
        "permCode": "SYSTEM",
        "permName": "系统管理",
        "permType": "MENU",
        "menuUrl": "/system",
        "icon": "SettingOutlined",
        "sortNo": 90,
        "status": 1,
        "createTime": "2026-05-02T10:00:00",
        "updateTime": "2026-05-02T10:00:00",
        "createBy": "",
        "updateBy": ""
      }
    ],
    "total": 25,
    "page": 1,
    "pageSize": 20
  }
}
```

### 3.2 查询权限树

**接口**：`GET /sys/permission/tree`

**响应示例**：
```json
{
  "code": 200,
  "message": "操作成功",
  "data": [
    {
      "id": 1,
      "permName": "系统管理",
      "children": [
        {
          "id": 11,
          "permName": "组织架构",
          "children": [
            {
              "id": 101,
              "permName": "组织架构-新增",
              "children": []
            }
          ]
        }
      ]
    }
  ]
}
```

### 3.3 根据ID查询权限

**接口**：`GET /sys/permission/{id}`

### 3.4 新增权限

**接口**：`POST /sys/permission`

**请求体**：
```json
{
  "parentId": 11,
  "permCode": "SYSTEM-ORG-VIEW",
  "permName": "组织架构-查看",
  "permType": "BUTTON",
  "menuUrl": "",
  "icon": "",
  "sortNo": 99,
  "status": 1
}
```

### 3.5 更新权限

**接口**：`PUT /sys/permission`

**请求体**：
```json
{
  "id": 1,
  "parentId": 0,
  "permCode": "SYSTEM",
  "permName": "系统管理",
  "permType": "MENU",
  "menuUrl": "/system",
  "icon": "SettingOutlined",
  "sortNo": 90,
  "status": 1
}
```

### 3.6 批量删除权限

**接口**：`DELETE /sys/permission`

**请求体**：`[1, 2, 3]`

### 3.7 批量更新权限状态

**接口**：`PUT /sys/permission/status`

**请求体**：
```json
{
  "ids": [1, 2, 3],
  "status": 1
}
```

### 3.8 移动权限节点

**接口**：`PUT /sys/permission/move`

**请求体**：
```json
{
  "id": 12,
  "newParentId": 11
}
```

---

## 四、工厂管理

### 4.1 分页查询工厂

**接口**：`GET /sys/factory/page`

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| orgId | Long | 否 | 组织ID |
| keyword | String | 否 | 搜索关键字（名称/编码/简称） |
| isDefault | Integer | 否 | 是否默认工厂：1是 0否 |
| status | Integer | 否 | 状态：1启用 0禁用 |
| page | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页条数，默认20 |

**响应示例**：
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "id": 1,
        "factoryCode": "FACT-001",
        "factoryName": "迈迪康青岛工厂",
        "shortName": "青岛工厂",
        "orgId": 2,
        "orgName": "制造中心",
        "address": "青岛市即墨区智能制造产业园",
        "contact": "张经理",
        "phone": "0532-88888888",
        "email": "",
        "isDefault": 1,
        "sortNo": 1,
        "status": 1,
        "createTime": "2026-05-02T10:00:00",
        "updateTime": "2026-05-02T10:00:00",
        "createBy": "",
        "updateBy": ""
      }
    ],
    "total": 3,
    "page": 1,
    "pageSize": 20
  }
}
```

### 4.2 查询所有工厂

**接口**：`GET /sys/factory/all`

**响应示例**：
```json
{
  "code": 200,
  "message": "操作成功",
  "data": [
    {
      "id": 1,
      "factoryCode": "FACT-001",
      "factoryName": "迈迪康青岛工厂",
      "shortName": "青岛工厂"
    },
    {
      "id": 2,
      "factoryCode": "FACT-002",
      "factoryName": "迈迪康深圳工厂",
      "shortName": "深圳工厂"
    }
  ]
}
```

### 4.3 根据ID查询工厂

**接口**：`GET /sys/factory/{id}`

### 4.4 新增工厂

**接口**：`POST /sys/factory`

**请求体**：
```json
{
  "factoryCode": "FACT-004",
  "factoryName": "迈迪康北京工厂",
  "shortName": "北京工厂",
  "orgId": 2,
  "orgName": "制造中心",
  "address": "北京市朝阳区科技园",
  "contact": "赵经理",
  "phone": "010-77777777",
  "email": "",
  "isDefault": 0,
  "sortNo": 4,
  "status": 1
}
```

### 4.5 更新工厂

**接口**：`PUT /sys/factory`

**请求体**：
```json
{
  "id": 1,
  "factoryCode": "FACT-001",
  "factoryName": "迈迪康青岛工厂",
  "shortName": "青岛工厂",
  "orgId": 2,
  "orgName": "制造中心",
  "address": "青岛市即墨区智能制造产业园",
  "contact": "张经理",
  "phone": "0532-88888888",
  "isDefault": 1,
  "sortNo": 1,
  "status": 1
}
```

### 4.6 批量删除工厂

**接口**：`DELETE /sys/factory`

**请求体**：`[1, 2, 3]`

### 4.7 批量更新工厂状态

**接口**：`PUT /sys/factory/status`

**请求体**：
```json
{
  "ids": [1, 2, 3],
  "status": 1
}
```

### 4.8 设置默认工厂

**接口**：`PUT /sys/factory/{factoryId}/default`

**路径参数**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| factoryId | Long | 是 | 工厂ID |

### 4.9 查询用户的工厂列表

**接口**：`GET /sys/factory/user/{userId}`

**路径参数**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | Long | 是 | 用户ID |

**响应示例**：
```json
{
  "code": 200,
  "message": "操作成功",
  "data": [
    {
      "id": 1,
      "factoryCode": "FACT-001",
      "factoryName": "迈迪康青岛工厂",
      "shortName": "青岛工厂"
    },
    {
      "id": 2,
      "factoryCode": "FACT-002",
      "factoryName": "迈迪康深圳工厂",
      "shortName": "深圳工厂"
    }
  ]
}
```

### 4.10 查询用户的默认工厂

**接口**：`GET /sys/factory/user/{userId}/default`

**路径参数**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | Long | 是 | 用户ID |

**响应示例**：
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": 1,
    "factoryCode": "FACT-001",
    "factoryName": "迈迪康青岛工厂",
    "shortName": "青岛工厂"
  }
}
```

### 4.11 为用户分配工厂

**接口**：`PUT /sys/factory/user/{userId}/assign`

**路径参数**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | Long | 是 | 用户ID |

**请求体**：
```json
{
  "factoryIds": [1, 2, 3],
  "defaultFactoryId": 1
}
```

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 操作成功 |
| 500 | 服务器内部错误 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |

## 注意事项

1. 所有日期时间格式为 ISO 8601：`yyyy-MM-ddTHH:mm:ss`
2. 批量删除操作会检查关联数据，如有依赖则不允许删除
3. 树形结构移动操作会防止循环引用
4. 默认工厂设置会取消其他工厂的默认状态
5. 角色权限分配会覆盖原有权限

---

**文档版本**：v1.0
**更新日期**：2026-05-02
