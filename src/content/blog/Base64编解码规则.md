---
author: firefly
pubDatetime: 2024-07-10T15:22:00Z
modDatetime: 2023-07-11T16:12:47.400Z
title: Base64的编码规则
slug: base64
featured: false
draft: false
tags:
  - JS
  - Base64
description: " "
---

## Base64

Base64其实就是一个规则，从这点来讲和字符集差不多，作用都是对数据进行编解码，从一种数据转换成另一种数据，Base64主要针对的是二进制数据，将二进制数据编码成文本数据在将文本数据解码成二进制数据

## Base64的实际使用

其实就是二进制数据转文本，这里看一个例子

一个相对简单的例子，实现图片上传，和拖拽上传并且实现图片预览，这里是用了`FileReader`这个对象，用来实现文件的预览，当然实际上使用`createObjectURL` 这个函数更好一些，代码也更简洁。这里使用了FileReader主要还是为了演示Base64。这里是用Base64的地方在`readAsDataURL` 这个函数，这个就是把你的上传的图片转换成了Base64编码，这里如下

```text
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxISEhUSEhIVFhUWFhYXFxgVFhgVFhYVFRUXFxUaFRcaHSghGBolGxoVIjEiJSkrLy4uGB8zODMsNygtLisBCgoKDg0OGxAQGzImHyYrLS0tLTIyMC0tLTUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy0tLS0tLS0tLS0tLS0tLf/AABEIARAAuQMBIgACEQEDEQH/....
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
