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

# 基于AOP实现数据脱敏的注解

## 什么是数据脱敏

数据脱敏是指通过对敏感数据进行处理，使其在不暴露真实信息的情况下，仍能保持数据的可用性，常用于保护隐私和安全。脱敏通常用于在测试、开发或者共享数据时，避免泄露敏感信息。常见的数据脱敏的方式大约有以下几种
1. 数据替换：用随机生成的数据或其他无意义的数据替代敏感数据。例如，使用虚拟的姓名、地址或电话号码代替真实的用户信息。

2. 数据加密：通过加密算法对敏感数据进行加密，只有授权的用户才能解密查看。例如，银行卡号可以通过加密算法存储，外部访问者无法获取明文。

3. 数据模糊化：将敏感数据进行模糊处理，保留部分信息，但不暴露完整细节。例如，将身份证号的后四位隐藏，电话号码的中间四位用星号替换。

4. 数据屏蔽：将敏感数据隐藏或完全删除，使得数据不可用，但仍然存在占位符。例如，显示“***”来代替实际的密码或银行卡号。

5. 数据拆分：将敏感数据拆成多个部分分别存储，使得无法通过一个数据集合恢复出完整的敏感信息。


## 替换方式实现数据脱敏注解基本流程

![数据脱敏流程](https://fireflyshen-img.oss-cn-beijing.aliyuncs.com/数据脱敏流程.png)

## 代码实现

1. 数据脱敏注解

```java
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface DataMask {
    DataMaskType value() default DataMaskType.DEFAULT;
}

```

上面这个注解很简单，就是作用在字段上，同时在运行时使用该注解

2. 枚举

```java

public enum     DataMaskType value() default DataMaskType.DEFAULT;
 {
    DEFAULT,   // 默认脱敏（如：****）
    EMAIL,     // 脱敏邮箱
    PHONE,     // 脱敏手机号
    ID_CARD    // 脱敏身份证
}

```

用于工具类判断脱敏的类型从而实现不同的脱敏策略

3. 策略工厂类

```java
@Component
public class DataSensitiveStrageFactory {

    private static final Map<DataMaskType, DataMaskStrage> strageMap = new HashMap<DataMaskType, DataMaskStrage>();
    private List<DataMaskStrage> strages;

    @Resource
    public void MaskDataFactory(List<DataMaskStrage> strages){
        this.strages = strages;
    }

    @PostConstruct
    public void init(){
        System.out.println(strages);
        strages.forEach(strage -> {
            System.out.println(strage);
            MaskStrage ano = strage.getClass().getAnnotation(MaskStrage.class);

            System.out.println(ano);
            if (ano != null) {
                strageMap.put(ano.value(), strage);
            }
        });

    }


    public static DataMaskStrage getMaskStarge(DataMaskType dataMaskType){
        System.out.println(strageMap);
        return strageMap.get(dataMaskType);
    }
}


```


4. 脱敏策略

```java

@MaskStrage(DataMaskType.EMAIL)
public class EmailMaskStrageImpl implements DataMaskStrage {
    @Override
    public String maskType(String data) {
        return DesensitizedUtil.email(data);
    }
}


```

5. 脱敏切面
```JAVA
@Aspect
@Component
public class DataMaskAop {

    @Pointcut("execution(* com.example.annotaionimplement.datasensitive.test..*(..))")
    public void excution() {}

    @AfterReturning(pointcut = "excution()",returning = "result")
    public void dataMask(JoinPoint joinPoint, Object result) {
        if (!Objects.isNull(result)){
            maskFiled(result.getClass(),result);
        }
    }

    private void maskFiled(Class<?> clazz,Object result){
        Field[] declaredFields = clazz.getDeclaredFields();

        try{
            for (Field declaredField : declaredFields) {
                if (declaredField.isAnnotationPresent(DataMask.class)){
                    DataMask dataMask = declaredField.getAnnotation(DataMask.class);
                    DataMaskType value = dataMask.value();

                    declaredField.setAccessible(true);

                    DataMaskStrage maskStarge = DataSensitiveStrageFactory.getMaskStarge(value);

                    String s = maskStarge.maskType((String) declaredField.get(result));

                    declaredField.set(result,s);
                }
            }
        } catch (RuntimeException e) {
            throw new RuntimeException(e);
        } catch (IllegalAccessException e) {
            throw new RuntimeException(e);
        }
    }

}
```


以上就是大致的实现，
总体流程大致如下
1. aop拦截执行后置返回通知
2. 获取返回值的class,遍历内部的属性，如果属性上有`DataMask`就说明此字段要进行脱敏
3. 根据注解的值获取对应的脱敏类型
4. 根据脱敏类型获取对应的脱敏策略实现，这里是在策略工厂类中在项目启动的时候将脱敏策略类缓存到一个全局Map中
5. 对字段进行脱敏
6. 将脱敏后的字段设置回去

