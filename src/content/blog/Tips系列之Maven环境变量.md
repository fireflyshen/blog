---
author: Sat Naing
pubDatetime: 2022-09-23T15:22:00Z
modDatetime: 2023-12-21T09:12:47.400Z
title: Tips系列之Maven环境配置问题：.mavenrc文件引发的神奇事件
slug: maventips-mavenrc
featured: false
draft: false
tags:
  - maven
  - tips
description: " "
---

Maven配置环境变量本身没啥说的，网上教程一搜一大把，今天要说的是我配置的时候遇到的一个不大不小的坑（也可能是我maven没学好🤔️）。windows上遇到这个问题的可能性不大，windows上基本上不用包管理器，虽然windows也有对应的包管理器chocolate，但是用的人可能相对较少。但是mac上面用的`brew`就非常多了

## 事件还原

本来打算用`sdkman`来管理环境，但是出现了一个问题，我使用`sdkman`安装Maven的时候出现了个问题，我使用`mvn -v`显示的一直是`brew`安装的`maven`，并且maven用的是`jdk22`，`vendor`是`Homebrew`，然而我的本地系统应用的`jdk`明明不是这个版本，这就有意思了，然后我就把`brew`安装的`maven`删除了,这下好了，我的`sdk maven`直接找不到`jdk`环境了，非常神奇，后续用`brew`又把maven装回来，又能找到了，但是`jdk`还是22，这能行吗，这不是被包管理器绑架了。网上查了半天资料，全都说要在`.zhsrc`(具体取决你的shell，如果用的`bash`，就是`bash_profile`)，配置JDK的环境变量，我的JDK配置没有任何问题。但是`maven`就是找不到，必须使用`brew`安装，邪了门了

### 原因

原因非常简单，是因为你在安装maven的时候使用`brew`会在你的用户目录下吗创建一个`.mavenrc`的文件，这个文件里面配置的就是当前的`jdk`环境的目录，`maven`会优先去这个文件中寻找`jdk`，如果找不到，那么就回去系统变量中找(就是shell文件中配置的那个)。如果你在这个文件中配置了，但是那个目录中没有对应的`jdk`，他就不回去系统变量中找了，直接报错。因为这个文件是使用`brew`安装时创建的，brew会自动帮你安装好`maven`的所有依赖，包括`openjdk`，然后帮你创建好`.mavenrc`,并且把它给你装的依赖`openjdk`的路径写入进去。这就是原因。所以只要你用了`brew`安装了，不管你怎么切换系统`jdk`它用的永远是`22`(取决于brew安装的依赖，一般都是最新)，`vendor`永远都是`Homebrew`,然后把`brew`安装的`maven`卸载了，依赖也没了，但是`.mavenrc`文件中的内容还在，你的新`maven`也就永远都找不到`jdk`环境了。

### 解决方法

删除这个文件中的内容就行了
