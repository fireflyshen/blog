---
author: Sat Naing
pubDatetime: 2022-09-23T15:22:00Z
modDatetime: 2023-12-21T09:12:47.400Z
title: 数据脱敏(基于Hutool和JackSon)
slug: data-mask
featured: false
draft: true
tags:
  - docs
description: " "
---

# 使用Hutools和JackSon实现数据脱敏

## 什么是数据脱敏

根据亚马逊的定义如下

> 数据脱敏(Data Masking）是一种数据安全技术，用于保护敏感数据，以防止未经授权的访问和使用。 数据脱敏通过对敏感数据进行一定程度的修改或替换，以隐藏敏感信息，同时保留数据的完整性和可用性，通常应用于测试、开发和演示环境中。

总之就是对数据进行一定的修饰，比如身份证号`123456`经过一定的修饰之后`1****6`从而保护数据不被侵犯，数据脱敏也有很多中，比如这种最常用的使用`*`替换敏感数据，也有其他的比如对数据加入一些"噪音"从而对数据进行一定混淆

## 数据脱敏的实现

实现起来很简单，使用现成的工具类就行，使用Hutools工具类，这个工具类中有一个`DesensitizedUtil`这么个工具类可以非常方便的实现数据的脱敏，同时搭配Jackson实现，需要实现Jackson的序列化器，当返回数据的时候传递给前端的json数据通过自定义序列化类，传递到前端的数据通过这个类加工之后传递进去的就是脱敏后的数据，具体实现如下

### 实现细节

1. 定义脱敏数据的枚举类型

```java
public enum DesensitizationTypeEnum {
    MY_RULE,
    USER_ID,
    CHINESE_NAME,
    ID_CARD,
    FIXED_PHONE,
    MOBILE_PHONE,
    ADDRESS,
    EMAIL,
    PASSWORD,
    CAR_LICENSE,
    BANK_CARD
}
```

这个不是重点，就是用来标注数据的类型

2. 自定义Jackson序列化类重写`serialize`函数

```java

@Override
public void serialize(String str, JsonGenerator jsonGenerator, SerializerProvider serializerProvider)
        throws IOException {
    switch (type) {
        // 自定义类型脱敏
        case MY_RULE:
            jsonGenerator.writeString(CharSequenceUtil.hide(str, startInclude, endExclude));
            break;
        // userId脱敏
        case USER_ID:
            jsonGenerator.writeString(String.valueOf(DesensitizedUtil.userId()));
            break;
        // 中文姓名脱敏
        case CHINESE_NAME:
            jsonGenerator.writeString(DesensitizedUtil.chineseName(String.valueOf(str)));
            break;
        // 身份证脱敏
        case ID_CARD:
            jsonGenerator.writeString(DesensitizedUtil.idCardNum(String.valueOf(str), 1, 2));
            break;
        // 固定电话脱敏
        case FIXED_PHONE:
            jsonGenerator.writeString(DesensitizedUtil.fixedPhone(String.valueOf(str)));
            break;
        // 手机号脱敏
        case MOBILE_PHONE:
            jsonGenerator.writeString(DesensitizedUtil.mobilePhone(String.valueOf(str)));
            break;
        // 地址脱敏
        case ADDRESS:
            jsonGenerator.writeString(DesensitizedUtil.address(String.valueOf(str), 8));
            break;
        // 邮箱脱敏
        case EMAIL:
            jsonGenerator.writeString(DesensitizedUtil.email(String.valueOf(str)));
            break;
        // 密码脱敏
        case PASSWORD:
            jsonGenerator.writeString(DesensitizedUtil.password(String.valueOf(str)));
            break;
        // 中国车牌脱敏
        case CAR_LICENSE:
            jsonGenerator.writeString(DesensitizedUtil.carLicense(String.valueOf(str)));
            break;
        // 银行卡脱敏
        case BANK_CARD:
            jsonGenerator.writeString(DesensitizedUtil.bankCard(String.valueOf(str)));
            break;
        default:
    }


```

这一步完成之后其实就已经实现了数据脱敏了,switch去掉，直接一句` jsonGenerator.writeString(CharSequenceUtil.hide(str, startInclude, endExclude));`后两个参数换成具体的数值，就可以了，然后使用` @JsonSerialize(using = CustomStringSerializer.class)`，数据脱敏就已经实现了，但是这样泛用性极差，因此一般还要搭配`ContextualSerializer`这个接口使用

3. 实现`ContextualSerializer`接口，实现脱敏的灵活性

```java
@Override
public JsonSerializer<?> createContextual(SerializerProvider serializerProvider, BeanProperty beanProperty)
        throws JsonMappingException {
    if (beanProperty != null) {
        if (Objects.equals(beanProperty.getType().getRawClass(), String.class)) {
            Desensitization desensitization = beanProperty.getAnnotation(Desensitization.class);
            if (desensitization == null) {
                desensitization = beanProperty.getContextAnnotation(Desensitization.class);
            }
            if (desensitization != null) {
                return new DesensitizationSerialize(desensitization.type(), desensitization.startInclude(),
                        desensitization.endExclude());
            }
        }

        return serializerProvider.findValueSerializer(beanProperty.getType(), beanProperty);
    }
    return serializerProvider.findNullValueSerializer(null);
}
```

上面的代码就是这样，简单点讲流程如下

- 判断字段是否为`null`
- 如果不为`null`,那么就拿到这个字段的原始类型，看他是不是`String`类型，
  - 如果是，那么就拿到修饰这个字段的`Desensitization`注解
    - 如果注解不是`null`，换句话说有这个注解进行修饰
    - 直接返回一个新的序列化器，将注解的值作为参数传递
  - 如果是`null`那么可能这个字段是从父类中继承而来，尝试从父类中获取注解，如果如果还是`null`就说明这个字段不需要数据脱敏操作
- 如果经过校验后还是`null`
  - 直接用默认的方式序列器即可，换句话说走的就是`default`分支啥也不干，直接就过去了

以上
