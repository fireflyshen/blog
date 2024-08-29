---
author: firefly
pubDatetime: 2022-09-23T15:22:00Z
modDatetime: 2023-12-21T09:12:47.400Z
title: JS函数的柯里化
slug: function-curry
featured: false
draft: false
tags:
  - minio
description: " "
---

# 使用Minio存储桶存储文件

通常上传文件都是上传到服务器这一步就没了，但是稍微上点规模的项目实际上都是使用的对象存储进行存储这种对象文件，使用专门的服务来进行文件存储。

## 传统的文件上传

![传统文件上传](https://fireflyshen-img.oss-cn-beijing.aliyuncs.com/img传统文件上传.png)

```java
package com.example.spring_upload.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class UploadControllerTransition {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @GetMapping("/")
    public String showUploadFormTrans() {
        return "upload";
    }

    @PostConstruct
    public void init() throws IOException {
        Path normalize = Paths.get(uploadDir).toAbsolutePath().normalize();
        if (!normalize.toFile().exists()) {
            Files.createDirectories(normalize);
        }
    }

    @PostMapping("/uploadTrans")
    public String uploadTrans(@RequestParam("file") MultipartFile file, Model model) throws IOException {
        // 验证
        if (file.isEmpty()) {
            model.addAttribute("message", "请选择文件");
            model.addAttribute("success", false);
            return "upload";
        }

        // 1. 获取文件内容与名称
        byte[] bytes = file.getBytes();
        String fileName = file.getName();
        // 2.获取相应路径
        Path path = Paths.get(uploadDir + file.getOriginalFilename());
        // 3.写入文件
        Files.write(path, bytes);
        model.addAttribute("message", "文件上传成功");
        model.addAttribute("success", true);
        return "upload";
    }

}

```

以上就是传统文件上传后简单的实现，其实就是在服务器内部创建了个文件夹，然后将文件写入进去。整个流程相对简单一些。但是也有一些弊端

1. 扩展性差: 传统服务器的存储容量有限,难以快速扩展来满足不断增长的存储需求。
2. 可靠性较低: 单个服务器可能存在单点故障风险,数据备份和冗余通常需要额外配置。
3. 管理复杂: 需要手动管理文件系统、权限设置、备份等,运维工作量大。

当然有一些软件用户需要私有化部署，然后又只有一台服务器，那就无所谓了，正常存储在服务器中即可

## 对象存储文件上传

对象存储文件上传其实和这个差不多，也是存储在一台服务器上面，这种专门用来存储文件的服务器，扩展性相对较好，同时不同地域的用户在访问的时候可以用不同地域的服务器，如果使用过阿里云，或者腾讯云或者其他类似文件对象存储系统。都有一个地域的概念（当然现在也可以选择无地域了）。这里就是服务器的地理位置，不同地域的用户可以使用不同地域的服务器提高用户的响应。

### 对象存储的选择

其实都大差不差，都是拿到必要的属性，然后引入sdk,正常调用api上传即可，这里是用Minio，这个是一个可以进行本地部署的一个对象存储服务，基本是兼容亚马逊SE3指令。具体流程如下

![存储桶](https://fireflyshen-img.oss-cn-beijing.aliyuncs.com/img存储桶.png)

```java

package com.example.spring_upload.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

import org.apache.tomcat.util.http.fileupload.FileUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import com.example.spring_upload.data.BucketPolicyConfigDto;
import com.example.spring_upload.data.MinioUploadDto;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.json.JSONUtil;
import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.ObjectWriteArgs;
import io.minio.PutObjectArgs;
import io.minio.SetBucketPolicyArgs;
import io.minio.errors.ErrorResponseException;
import io.minio.errors.InsufficientDataException;
import io.minio.errors.InternalException;
import io.minio.errors.InvalidResponseException;
import io.minio.errors.ServerException;
import io.minio.errors.XmlParserException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

/**
 * UploadController
 */
@Controller
@Slf4j
public class UploadController {
    @Value("${minio.endpoint}")
    private String ENDPOINT;
    @Value("${minio.bucketName}")
    private String BUCKET_NAME;
    @Value("${minio.accessKey}")
    private String ACCESS_KEY;
    @Value("${minio.secretKey}")
    private String SECRET_KEY;

    @GetMapping("/")
    public String index() {
        return "upload";
    }


    @PostMapping("/upload")
    @ResponseBody
    public String upload(@RequestParam("file") MultipartFile file, Model model) throws IOException, InvalidKeyException,
            ErrorResponseException, InsufficientDataException, InternalException, InvalidResponseException,
            NoSuchAlgorithmException, ServerException, XmlParserException, IllegalArgumentException {
        // 创建一个MinIO的Java客户端
        MinioClient minioClient = MinioClient.builder().endpoint(ENDPOINT).credentials("wiVidvN2hn7Vzxee0n", "mBJ95noRlV96e9QSTa043ftx62qykGHFhQKPYg").build();
        // 判断存储桶是否存在
        boolean bucketExists = minioClient.bucketExists(BucketExistsArgs.builder().bucket("test").build());
        if (!bucketExists) {
            // 不存在创建
            minioClient.makeBucket(MakeBucketArgs.builder().bucket("test").build());
            BucketPolicyConfigDto bucketPolicyConfigDto = createBucketPolicyConfigDto("test");
            SetBucketPolicyArgs setBucketPolicyArgs = SetBucketPolicyArgs.builder()
                    .bucket(BUCKET_NAME)
                    .config(JSONUtil.toJsonStr(bucketPolicyConfigDto))
                    .build();
            minioClient.setBucketPolicy(setBucketPolicyArgs);
        } else {
            log.info("存储桶已经存在");
        }

        // 获取文件
        String filename = file.getOriginalFilename();
        // 上传
        PutObjectArgs putObjectArgs = PutObjectArgs.builder().bucket("test").object(filename)
                .contentType(file.getContentType())
                .stream(file.getInputStream(), file.getSize(), ObjectWriteArgs.MIN_MULTIPART_SIZE).build();
        minioClient.putObject(putObjectArgs);

        log.info("文件上传成功");
        MinioUploadDto minioUploadDto = new MinioUploadDto();
        minioUploadDto.setName(filename);
        minioUploadDto.setUrl(ENDPOINT + "/" + BUCKET_NAME + "/" + filename);
        return "yes";
    }


    // 配置权限
    private BucketPolicyConfigDto createBucketPolicyConfigDto(String bucketName) {
        BucketPolicyConfigDto.Statement statement = BucketPolicyConfigDto.Statement.builder().Effect("Allow").Principal("*")
        .Action("s3:GetObject")
        .Resource("arn:aws:s3:::"+bucketName+"/*.**").build();

        return BucketPolicyConfigDto.builder()
                .Version("2012-10-17")
                .Statement(CollUtil.toList(statement))
                .build();
    }

}

```

以上

感谢阅读。。。

## 参考

[整合spring实现文件上传](https://www.yuque.com/macrozheng/mall-learning/pocu2m4vzgh6hh46)
