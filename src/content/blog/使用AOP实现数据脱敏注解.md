---
author: Sat Naing
pubDatetime: 2022-09-23T15:22:00Z
modDatetime: 2023-12-21T09:12:47.400Z
title: 基于AOP与策略模式实现数据脱敏注解
slug: data-mask-aop
featured: false
draft: false
tags:
  - docs
description: " "
---

## 流程

1. 创建数据脱敏注解

2. AOP 使用后置返回通知，获取对应的返回值

3. 获取对应的返回值，遍历所有字段获取对应的值，之后根据策略模式调用对应的策略实现数据脱敏

## 代码实现

**数据脱敏注解**

用来标注需要脱敏的字段

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface DataMask {
    DataMaskType value() default DataMaskType.MY_RULE;
}
```

**枚举类**

用来标注脱敏字段的类型以便执行不同的脱敏策略

```java
public enum DataMaskType {
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

**策略注解**

用来标注策略类，调用不同的策略接口

```java
@Component
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface MaskTypeStrage {

    DataMaskType value();

}

```

**策略接口**

```java

@FunctionalInterface
public interface MaskStrage {

    String maskType(String data);
}

```

**策略实现类**

```java
@MaskTypeStrage(DataMaskType.MOBILE_PHONE)
public class PhoneMaskStrage implements MaskStrage {
    @Override
    public String maskType(String phone) {
        return DesensitizedUtil.mobilePhone(phone);
    }
}


@MaskTypeStrage(DataMaskType.EMAIL)
public class MailMaskStrage implements MaskStrage {
    @Override
    public String maskType(String email) {
        return DesensitizedUtil.email(email);
    }
}

```

**AOP切面类**

```java
@Aspect
@Component
public class DataMaskAop {


    @Pointcut("execution(* com.ruoyi.annotation.service..*(..))")
    public void serviceMethod() {
    }


    @AfterReturning(pointcut = "serviceMethod()", returning = "result")
    public void dataMask(JoinPoint joinPoint, Object result) {

        if (!Objects.isNull(result)) {
            maskFiled(result.getClass(), result);
        }
    }


    private void maskFiled(Class<?> clz, Object result) {
        Field[] declaredFields = clz.getDeclaredFields();

        try {
            for (Field declaredField : declaredFields) {
                boolean annotationPresent = declaredField.isAnnotationPresent(DataMask.class);
                if (annotationPresent) {
                    DataMask annotation = declaredField.getAnnotation(DataMask.class);
                    DataMaskType value = annotation.value();
                    declaredField.setAccessible(true);
                    MaskStrage maskStrage = MaskDataFactory.getMaskStrage(value);
                    String s = maskStrage.maskType(((String) declaredField.get(result)));
                    declaredField.set(result, s);
                }

            }
        } catch (IllegalAccessException e) {
            throw new RuntimeException(e);
        }

    }

}

```
