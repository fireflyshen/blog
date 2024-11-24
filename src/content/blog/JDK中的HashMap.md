---
author: firefly
pubDatetime: 2022-09-23T15:22:00Z
modDatetime: 2023-12-21T09:12:47.400Z
title: 【源码探究】JDK中的HashMap
slug: JDK-HashMap
featured: false
draft: false
tags:
  - Java
  - Map
  - SourceCode
description: " "
---

# JDK中的HashMap

## PutVal

```java
 final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                   boolean evict) {
        Node<K,V>[] tab; Node<K,V> p; int n, i;
        if ((tab = table) == null || (n = tab.length) == 0)
            n = (tab = resize()).length;
        if ((p = tab[i = (n - 1) & hash]) == null)
            tab[i] = newNode(hash, key, value, null);
        else {
            Node<K,V> e; K k;
            if (p.hash == hash &&
                ((k = p.key) == key || (key != null && key.equals(k))))
                e = p;
            else if (p instanceof TreeNode)
                e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
            else {
                for (int binCount = 0; ; ++binCount) {
                    if ((e = p.next) == null) {
                        p.next = newNode(hash, key, value, null);
                        if (binCount >= TREEIFY_THRESHOLD - 1) // -1 for 1st
                            treeifyBin(tab, hash);
                        break;
                    }
                    if (e.hash == hash &&
                        ((k = e.key) == key || (key != null && key.equals(k))))
                        break;
                    p = e;
                }
            }
            if (e != null) { // existing mapping for key
                V oldValue = e.value;
                if (!onlyIfAbsent || oldValue == null)
                    e.value = value;
                afterNodeAccess(e);
                return oldValue;
            }
        }
        ++modCount;
        if (++size > threshold)
            resize();
        afterNodeInsertion(evict);
        return null;
    }


```

上面就是`put`函数的源码，大致的流程如下

1. 判断这个HashMap的长度是否为0，如果是空，或者长度是0那么他会进行扩容

```java
if ((tab = table) == null || (n = tab.length) == 0)
        n = (tab = resize()).length;

```

2. 计算hash值，通过hash值计算索引，如果这个地方为空，那么直接将值放进去

```java
if ((p = tab[i = (n - 1) & hash]) == null)
    tab[i] = newNode(hash, key, value, null);
```

3. 如果不是null,说明出现了hash冲突，以下这里都是用来处理哈希冲突的情况

   - 如果key的hash值相等，并且调用equals也相等，那么就将旧的值线暂存到e中，注意p这里是旧的值，比如一个key:"n"的value为"hello",然后相同key再次插入"hiii",这个时候会先查出“hello”这个节点先暂存到e中

     ```java
         if (p.hash == hash &&
             ((k = p.key) == key || (key != null && key.equals(k))))
             e = p;

     ```

   - 如果这个节点是一个红黑树的话，那么直接将其作为叶节点插入即可

   ```java
       else if (p instanceof TreeNode)
           e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
   ```

   - 如果两个情况都不是，那么就是链表的情况，遍历链表插入即可，内部判断如果链表到达了一定的长度，就转换为红黑树，然后将旧值保存

   ```java
        for (int binCount = 0; ; ++binCount) {
           if ((e = p.next) == null) {
               p.next = newNode(hash, key, value, null);
               if (binCount >= TREEIFY_THRESHOLD - 1) // -1 for 1st
                   treeifyBin(tab, hash);
               break;
           }
           if (e.hash == hash &&
               ((k = e.key) == key || (key != null && key.equals(k))))
               break;
           p = e;
       }
   ```

4. 更新值，上面出了红黑树的情况之外，其他的都是暂存旧值，在处理完成hash冲突之后统一更新值

```java
 if (e != null) { // existing mapping for key
    V oldValue = e.value;
    if (!onlyIfAbsent || oldValue == null)
        e.value = value;
    afterNodeAccess(e);
    return oldValue;
}
```

5. 更新map

```java
++modCount;
if (++size > threshold)
    resize();
afterNodeInsertion(evict);
return null;

```

- modCount 是 HashMap 中的一个成员变量，用于记录 HashMap 的修改次数。
- 将 size 与 threshold 进行比较。 threshold 是 HashMap 的扩容阈值，当 HashMap 中的键值对数量超过 threshold 时，就需要扩容哈希表，以避免哈希冲突过多，影响性能。
  - 如果 size 大于 threshold，则调用 resize() 方法进行扩容
- afterNodeInsertion(evict);
  - 这是一个 "钩子方法"，允许 LinkedHashMap 等子类进行一些额外的操作。
  - 例如，LinkedHashMap 会在这个方法中删除最久未使用的节点，以维护其访问顺序。
  - evict 参数是一个布尔值，用于指示是否需要驱逐节点。
