---
author: firefly
pubDatetime: 2022-09-23T15:22:00Z
modDatetime: 2023-12-21T09:12:47.400Z
title: Base64的编码规则
slug: base64
featured: false
draft: false
tags:
  - JS
  - Base64
description: " "
---

# Base64编解码规则

## Base64

Base64其实就是一个规则，从这点来讲和字符集差不多，作用都是对数据进行编解码，从一种数据转换成另一种数据，Base64主要针对的是二进制数据，将二进制数据编码成文本数据在将文本数据解码成二进制数据

## Base64的实际使用

其实就是二进制数据转文本，这里看一个例子

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>图片预览示例</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
        background-color: #f0f0f0;
      }
      .container {
        text-align: center;
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      #preview {
        max-width: 100%;
        max-height: 100%;
        /* margin-top: 20px; */
        border: 1px solid #ddd;
        border-radius: 4px;
      }

      #imageInput {
        display: none;
      }

      #previewContainer {
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        /* background-color: aqua; */
        object-fit: cover;
        font-size: 0;
      }

      #previewContainer > img {
        width: 100%;
        object-fit: cover;
        font-size: 0;
      }

      #fileDragInput {
        position: relative;
        width: 300px;
        height: 200px;
        /* background-color: aqua; */
        border: 1px #eee solid;
        border-radius: 10px;
      }

      #fileDragInput:hover {
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>图片预览</h2>
      <input type="file" id="imageInput" accept="image/*" />

      <p>拖拽文件到此处</p>
      <div id="fileDragInput">
        <div id="previewContainer">
          <img id="preview" src="" alt="图片预览" style="display: none" />
        </div>
      </div>
    </div>

    <script>
      const imageInput = document.getElementById("imageInput");
      const preview = document.getElementById("preview");
      var element = document.getElementById("fileDragInput");

      element.addEventListener("click", () => {
        imageInput.click();
      });

      imageInput.addEventListener("change", e => {
        var file = e.target.files[0];

        if (!file) alert("没有文件");

        handleFile(file);
      });

      // 实现拖拽

      element.addEventListener("dragover", e => {
        e.preventDefault();
        console.log("hello drag");
      });

      element.addEventListener("dragleave", e => {
        console.log("hello dragleave");
      });

      element.addEventListener("drop", e => {
        e.preventDefault();
        var file = e.dataTransfer.files[0];
        handleFile(file);
      });

      function handleFile(file) {
        if (!file.type.startsWith("image")) {
          alert("请上传图片");
          return;
        }
        var fileReader = new FileReader();
        fileReader.onload = function (e) {
          preview.src = e.target.result;
          preview.style.display = "block";
        };

        fileReader.onloadstart = function (e) {
          console.log("hello");
        };

        fileReader.onloadend = function (e) {
          console.log("hello end");
        };
        fileReader.readAsDataURL(file);
      }
    </script>
  </body>
</html>
```

一个相对简单的例子，实现图片上传，和拖拽上传并且实现图片预览，这里是用了`FileReader`这个对象，用来实现文件的预览，当然实际上使用`createObjectURL` 这个函数更好一些，代码也更简洁。这里使用了FileReader主要还是为了演示Base64。这里是用Base64的地方在`readAsDataURL` 这个函数，这个就是把你的上传的图片转换成了Base64编码，这里如下

```text
data:image/jpeg;base64,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
```

上面就是我上传图片之后进行编码之后的数据，可以尝试是用一个`<img>`标签，然后将src的数据复制成上面的内容，的到效果如下图

![20240826092107](https://fireflyshen-img.oss-cn-beijing.aliyuncs.com/img20240826092107.png)

## Base64的编码规则

Base64的编码规则非常简单，实际上就是一套映射规则，首先为什么`Base64`是64不是其他的数字，就是因为他是使用了64个字符进行规则映射，如下所示👇

- 大写字母A-Z (26个字符)
- 小写字母a-z (26个字符)
- 数字0-9 (10个字符)
- 符号"+"和"/" (2个字符)

如上刚好64个，当然还有一个凑数的`=`字符，如果见过密钥的话应该见过如下格式的密钥

```text

bUdOTONogRAdfQ3BI0t021TlPCOIzBhywT7Ez+B9ir1/EqAIkTlsAWzYiHk3uTb+yb/AG5Djlu2IdYCZ1B6b9YusnVnLaJlcY8sgVODvBBOmWbHSZ1Hsf6glr8MLAfGwkQSBJ6m8dRr15KVT458JyjM1pAdqT4d52toOQQ1eKsfY0wASPhN8piW6xqLcrKKlU5QWgVNTD1GXIcAI00ubJp+IeQZcSNL315dVYYzEU3gRWqB4HiDryZOkbZY8r6qnfWnXn77LRC8t0FiNXcS8km5KRx+vPVc8+K317rncvr5Fbo7G2n6pIweJcx4ewwROmoBEH5LR/vI7K2GiQROa+aNDzEctPW6ytKLc+Ss6FMEAnYfh+KyYilFtOSM9W8XoWB7Q1dnAb2AmNhPKYQjjlYkeJ28+IixsTM6315osHwlzgMoBmwIMCSbTIv/AHTzuBGB42zIB1EyCTlnWARppBWX9FaWRWlN7EOvxWs4OmoTmbBBJMxoddotyXvmc8z7rwyvwkMDjnBJyhseJviEzO4FxK947vqPmteHcNbF9FS1uf/Z==

```

后面跟了两个等号，这玩意就是一个Base64编码的情况。后面的等号就是个填充字符

下面是`Base64`的编码表

**Base64的编码过程**

1. 将输入的数据以3个字节分成一组
2. 将这3个字节的24位分成4组,每组6位
3. 每组6位转换成一个0-63之间的数字
4. 根据这个数字查表得到对应的可打印字符

例：比如hello这个单词进行Base64编码过程如下

1. 首先查处这个单词的ASCII码，对应为`104,101,108,108,111`
2. 得到二进制编码分别是`01101000 01100101 01101100 01101100 01101111`
3. 将二进制数据进行分组，每6位一组，`011010 000110 010101 101100 011011 000110 1111`
4. 因为最后一位不够6位因此补0`011010 000110 010101 101100 011011 000110 111100`
5. 将分组的6位转换成十进制，然后根据编码表找到对应的饿字符，`26 6 21 44 27 6 60`=> `26 = a 6 = G 21 = V 44 = s 27 = b 6 = G 60 = 8`
6. 将这些字符链接起来`aGVsbG8`
7. 因为原始字符串是`hello`总共5个字节，而Base64是将3个字节编码成4个`Base64`字符,所以这里用`5 % 3 = 2`根据编码规则因此是一个=
   1. 如果余0，不添加"="
   2. 如果余1，添加两个"=="
   3. 如果余2，添加一个"="

**Base64的解码过程**

1. 移除填充字符`=`,得到`aGVsbG8`
2. 将字符按照编码表转换成`Base64`编码索引:`26 = a 6 = G 21 = V 44 = s 27 = b 6 = G 60 = 8` => `26 6 21 44 27 6 60`
3. 将每个索引值转换为6位二进制：`26 -> 011010 6  -> 000110 21 -> 010101 44 -> 101100 27 -> 011011 6  -> 000110 60 -> 111100`
4. 将所有二进制位连接起来：`011010000110010101101100011011000110111100`
5. 将这串二进制每8位分成一组（因为一个字节是8位）：`01101000 01100101 01101100 01101100 01101111 00`
6. 处理多余的位：
   1. 我们知道原始编码末尾有一个"="，这表示最后一组3字节中只有2个有效字节。
   2. 因此，我们可以安全地丢弃最后的两个"0"，因为它们是在编码过程中为了凑够6位而添加的，不属于原始数据。
7. 得到实际的二进制数据：`01101000 01100101 01101100 01101100 01101111`
8. 将每组8位二进制转换为对应的ASCII值：`01101000 -> 104 01100101 -> 101 01101100 -> 108 01101100 -> 108 01101111 -> 111`
9. 将ASCII值转换为对应的字符：`104 -> h 101 -> e 108 -> l 108 -> l 111 -> o`
10. 组合这些字符：`hello`

## 处理Base64数据的API

### 处理字符类型的数据

```js
var str = "hello,world";
// 编码
var base64Code = btoa(str);
console.log(base64Code); // aGVsbG8sd29ybGQ=

// 解码
var originData = atob(base64Code);
console.log(originData); // hello,world

// 处理UniCode字符
var unicodeString = "你好，世界！";
var textEncoder = new TextEncoder();
// 将unicode编码成utf8字节
var utf8Bytes = textEncoder.encode(unicodeString);

// 将二进制转换成字符
var code = String.fromCharCode(...utf8Bytes);
var base64Unicode = btoa(code);
console.log(base64Unicode);

// 解码过程
// 将编码的Base64解码成二进制数据
var uniCodeBytes = atob(base64Unicode);
// 创建一个二进制数组用于盛放数据
var uint8Array = new Uint8Array(uniCodeBytes.length);
// 循环将其转换成unicod数据
for (let i = 0; i < uint8Array.length; i++) {
  uint8Array[i] = uniCodeBytes.charCodeAt(i);
}
// 解码unicode
var originDataUniCode = new TextDecoder().decode(uint8Array);
console.log(originDataUniCode);
```

## 附：Base64编码表

| 值  | 字符 | 值  | 字符 | 值  | 字符 | 值  | 字符 |
| --- | ---- | --- | ---- | --- | ---- | --- | ---- |
| 0   | A    | 16  | Q    | 32  | g    | 48  | w    |
| 1   | B    | 17  | R    | 33  | h    | 49  | x    |
| 2   | C    | 18  | S    | 34  | i    | 50  | y    |
| 3   | D    | 19  | T    | 35  | j    | 51  | z    |
| 4   | E    | 20  | U    | 36  | k    | 52  | 0    |
| 5   | F    | 21  | V    | 37  | l    | 53  | 1    |
| 6   | G    | 22  | W    | 38  | m    | 54  | 2    |
| 7   | H    | 23  | X    | 39  | n    | 55  | 3    |
| 8   | I    | 24  | Y    | 40  | o    | 56  | 4    |
| 9   | J    | 25  | Z    | 41  | p    | 57  | 5    |
| 10  | K    | 26  | a    | 42  | q    | 58  | 6    |
| 11  | L    | 27  | b    | 43  | r    | 59  | 7    |
| 12  | M    | 28  | c    | 44  | s    | 60  | 8    |
| 13  | N    | 29  | d    | 45  | t    | 61  | 9    |
| 14  | O    | 30  | e    | 46  | u    | 62  | +    |
| 15  | P    | 31  | f    | 47  | v    | 63  | /    |
