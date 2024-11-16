---
author: Sat Naing
pubDatetime: 2022-09-23T15:22:00Z
modDatetime: 2023-12-21T09:12:47.400Z
title: 数据脱敏(基于AOP)
slug: data-mask-aop
featured: false
draft: false
tags:
  - docs
description: " "
---

# 是用AOP实现数据脱敏注解

## 流程

1. 创建数据脱敏注解

2. AOP 使用后置返回通知，获取对应的返回值

3. 获取相应的字段

## 代码实现

1. 数据脱敏注解

```java

@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface DataMask {

    MaskType value() default MaskType.DEFAULT;
}


```

上面这个注解很简单，就是作用在字段上，同时在运行时使用该注解

2. 枚举

```java

public enum MaskType {
    DEFAULT,   // 默认脱敏（如：****）
    EMAIL,     // 脱敏邮箱
    PHONE,     // 脱敏手机号
    ID_CARD    // 脱敏身份证
}

```

用于工具类判断脱敏的类型从而实现不同的脱敏策略

3. 脱敏工具类

```java
public class DataMaskUtil {

    public static String mask(String value, MaskType type) {
        if (value == null || value.isEmpty()) {
            return value;
        }

        switch (type) {
            case EMAIL:
                return value.replaceAll("(?<=.{2}).(?=.*@)", "*");
            case PHONE:
                return value.replaceAll("(?<=.{3}).(?=.{4})", "*");
            case ID_CARD:
                return value.replaceAll("(?<=\\d{6})\\d(?=\\d{4})", "*");
            default:
                return value.replaceAll(".", "*");  // 默认脱敏
        }
    }
}

```

主要是一些脱敏策略，如果需要的脱敏策略特别多，可以使用策略模式进行优化

4. 脱敏切面

```java


@Aspect
@Component
public class DataMaskingAspect {

    // 切点：匹配所有方法，目标方法必须返回对象
    @AfterReturning(pointcut = "execution(public * *(..))", returning = "returnValue")
    public void afterReturning(JoinPoint joinPoint, Object returnValue) {
        // 确保返回值非空，并且是一个对象（避免处理基本数据类型或空值）
        if (Objects.nonNull(returnValue)) {
            // 获取返回值对象的类
            Class<?> clazz = returnValue.getClass();

            // 递归检查所有字段并脱敏
            maskFields(returnValue, clazz);
        }
    }

    private void maskFields(Object returnValue, Class<?> clazz) {
        // 获取所有字段，包括私有字段
        Field[] fields = clazz.getDeclaredFields();

        // 遍历字段并检查是否有 DataMask 注解
        for (Field field : fields) {
            if (field.isAnnotationPresent(DataMask.class)) {
                DataMask dataMask = field.getAnnotation(DataMask.class);
                MaskType maskType = dataMask.value();  // 获取注解上设置的脱敏类型

                try {
                    // 设置字段可访问
                    field.setAccessible(true);
                    String originalValue = (String) field.get(returnValue);  // 获取字段原值
                    String maskedValue = DataMaskUtil.mask(originalValue, maskType);  // 执行脱敏
                    field.set(returnValue, maskedValue);  // 设置脱敏后的值
                } catch (IllegalAccessException e) {
                    e.printStackTrace();
                }
            }

            // 递归处理父类字段，支持继承的字段
            if (field.getType().getSuperclass() != null) {
                maskFields(returnValue, field.getType().getSuperclass());
            }
        }
    }
}


```

脱敏切面类，就是拦截对应的方法，然后将对应的字段进行修改，进行脱敏
