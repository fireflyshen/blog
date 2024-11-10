---
author: firefly
pubDatetime: 2024-09-23T15:22:00Z
modDatetime: 2024-10-21T19:12:47.400Z
title: 使用Minio存储桶存储文件
slug: object-store-monio
featured: false
draft: true
tags:
  - minio
description: " "
---

通常上传文件都是上传到服务器这一步就没了，但是稍微上点规模的项目实际上都是使用的对象存储进行存储这种对象文件，使用专门的服务来进行文件存储。

## 传统的文件上传

![传统文件上传](https://fireflyshen-img.oss-cn-beijing.aliyuncs.com/img传统文件上传.png)

```java
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

1. 配置minio的必要属性

```properteis
minio.endpoint: http://47.xx.xx.115:9000
minio.bucketName: test
minio.accessKey: whiVikdvN2hee0n
minio.secretKey: mBJ99QSTa043ftx62qykGHFhQdKPYVg
```

2. 实现文件上传

```java

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

## 附：minio的安装与如何获取对应的accesskey,scretekey

### 安装

安装这里直接使用docker就行，monio安装着不难，主要是docker的安装，你在配置docker的仓库的时候，因为某些众所周知的原因，你会得到一个超时的提示，所以需要用镜像库,具体步骤如下

1. 移除旧的docker镜像

```shell
sudo apt-get remove docker docker-engine docker.io containerd runc
```

2. 更新包索引

```shell
sudo apt-get update
```

3. 安装依赖

```shell
sudo apt-get install apt-transport-https ca-certificates curl gnupg lsb-release

```

4. 添加阿里云的镜像

```shell
curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
```

5. 添加阿里云的软件源

```shell
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

6. 更新包索引

```shell
sudo apt-get update
```

7. 安装dockerCE

```shell
sudo apt-get install docker-ce docker-ce-cli containerd.io
```

8. 安装minio

```shell
docker run -d \
     -p 9000:9000 \
     -p 9001:9001 \
     -e "MINIO_ROOT_USER=minioadmin" \
     -e "MINIO_ROOT_PASSWORD=minioadmin" \
     -v ~/minio/data:/data \
     --name minio \
     quay.io/minio/minio server /data --console-address ":9001"
```

### 获取key

minio获取key就更简单了
你在安装完成之后访问`ip:9001`就能进入到minio准备好的webui界面了。进入之后是如下界面，按着箭头指示创建就行

![20240829112327](https://fireflyshen-img.oss-cn-beijing.aliyuncs.com/img20240829112327.png)

## 参考

[整合spring实现文件上传](https://www.yuque.com/macrozheng/mall-learning/pocu2m4vzgh6hh46)
