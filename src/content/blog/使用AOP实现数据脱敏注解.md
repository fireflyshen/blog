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

1. 用来标注需要脱敏的字段

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface DataMask {
    DataMaskType value() default DataMaskType.MY_RULE;
}
```

2. **枚举类**

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

3. **策略注解**

用来标注策略类，调用不同的策略接口

```java
@Component
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface MaskTypeStrage {

    DataMaskType value();

}

```

4. **策略接口**

```java

@FunctionalInterface
public interface MaskStrage {

    String maskType(String data);
}

```

5. **策略实现类**

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

6. **策略工厂类**

生产指定的策略，实现脱敏的核心之一，因为有了策略工厂才实现了数据脱敏的灵活性

1. Map作为容器，键值是对应的脱敏类型，值是对应的策略实现类
2. 使用构造器注入,将内存中的所有策略实现类,注入到策略List中
3. 使用@PostConstruct注解，在属性注入完毕之后将策略实现注入到Map中
4. 对外暴露获取策略的方法

```java
@Component
public class MaskDataFactory {


    private static final Map<DataMaskType, MaskStrage> strageMap = new HashMap<>();

    List<MaskStrage> strages;

    @Resource
    public void MaskDataFactory(List<MaskStrage> strages){
       this.strages = strages;
    }

    @PostConstruct
    public void init(){
        strages.forEach(strage -> {
            MaskTypeStrage annotation = strage.getClass().getAnnotation(MaskTypeStrage.class);
            if (annotation != null) strageMap.put(annotation.value(),strage);
        });
    }


    public static MaskStrage getMaskStrage(DataMaskType type){
        return strageMap.get(type);
    }
}
```

7. **AOP切面类**

实现脱敏的核心

1. 获取所有的返回值所有的字段
2. 判断字段上面有没有打上制定的住饥饿
3. 如果有对应的脱敏注解，获取指定的注解的类型，之后根据这个类型是用策略工厂调用对应的策略
4. 获取脱敏后的值，重新注入对象中

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
