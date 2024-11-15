---
author: firefly
pubDatetime: 2022-09-23T15:22:00Z
modDatetime: 2023-12-21T09:12:47.400Z
title: AQS原理说明
slug: aqs
featured: false
draft: true
tags:
  - AQS
  - conrupt
description: " "
---

## AQS

aqs 实际上就是`java`用来管理锁竞争的一个机制，多线程中的好多类库都使用了这个机制，这个机制简单点概括就是所有的线程在一个队列中排队，根据队列中的状况决定线程的状态是挂起阻塞，还是自旋等待，还是获取资源执行。AQS 对于锁和资源实际上是有一个状态的标记的 state 的，这个 state 用来标记资源的状态，具体状态如下

- state == 0 表示资源没有被占用
- state > 0 表示资源已经被占用
- state < 0 表示有线程在等待
  - 这个简单点讲就是线程 1 可能已经获取了资源或者锁，这个时候，其他的线程，线程 3 和线程 2 都在请求资源，这个时候就会陷入等待状态，这里是两个线程，也就说 state == -2。

### AQS 原理

AQS 被应用于很多多线程的包下，实际的核心代码实际上就是如下

```java
    final int acquire(Node node, int arg, boolean shared,
                      boolean interruptible, boolean timed, long time) {
        Thread current = Thread.currentThread();
        byte spins = 0, postSpins = 0;   // retries upon unpark of first thread
        boolean interrupted = false, first = false;
        Node pred = null;               // predecessor of node when enqueued

        for (;;) {
            if (!first && (pred = (node == null) ? null : node.prev) != null &&
                !(first = (head == pred))) {
                if (pred.status < 0) {
                    cleanQueue();           // predecessor cancelled
                    continue;
                } else if (pred.prev == null) {
                    Thread.onSpinWait();    // ensure serialization
                    continue;
                }
            }
            if (first || pred == null) {
                boolean acquired;
                try {
                    if (shared)
                        acquired = (tryAcquireShared(arg) >= 0);
                    else
                        acquired = tryAcquire(arg);
                } catch (Throwable ex) {
                    cancelAcquire(node, interrupted, false);
                    throw ex;
                }
                if (acquired) {
                    if (first) {
                        node.prev = null;
                        head = node;
                        pred.next = null;
                        node.waiter = null;
                        if (shared)
                            signalNextIfShared(node);
                        if (interrupted)
                            current.interrupt();
                    }
                    return 1;
                }
            }
            Node t;
            if ((t = tail) == null) {           // initialize queue
                if (tryInitializeHead() == null)
                    return acquireOnOOME(shared, arg);
            } else if (node == null) {          // allocate; retry before enqueue
                try {
                    node = (shared) ? new SharedNode() : new ExclusiveNode();
                } catch (OutOfMemoryError oome) {
                    return acquireOnOOME(shared, arg);
                }
            } else if (pred == null) {          // try to enqueue
                node.waiter = current;
                node.setPrevRelaxed(t);         // avoid unnecessary fence
                if (!casTail(t, node))
                    node.setPrevRelaxed(null);  // back out
                else
                    t.next = node;
            } else if (first && spins != 0) {
                --spins;                        // reduce unfairness on rewaits
                Thread.onSpinWait();
            } else if (node.status == 0) {
                node.status = WAITING;          // enable signal and recheck
            } else {
                long nanos;
                spins = postSpins = (byte)((postSpins << 1) | 1);
                if (!timed)
                    LockSupport.park(this);
                else if ((nanos = time - System.nanoTime()) > 0L)
                    LockSupport.parkNanos(this, nanos);
                else
                    break;
                node.clearStatus();
                if ((interrupted |= Thread.interrupted()) && interruptible)
                    break;
            }
        }
        return cancelAcquire(node, interrupted, interruptible);
    }
```

先把这个函数弄明白，后面不管是`Reetranlock`还是`Countlanch`这些都差不多了

**判断当前节点是否第一个节点，是否前面至少有两个节点**

代码如下

```java
if (!first && (pred = (node == null) ? null : node.prev) != null &&
    !(first = (head == pred))) {
    if (pred.status < 0) {
        cleanQueue();           // predecessor cancelled
        continue;
    } else if (pred.prev == null) {
        Thread.onSpinWait();    // ensure serialization
        continue;
    }
}

```

这里重要的实际上就是这个条件写的稍微有点浮在

```java
if (!first && (pred = (node == null) ? null : node.prev) != null &&
    !(first = (head == pred)))
```

这里先判断是否是第一个节点，如果不是则判断前置节点是否是`null`如果满足这两个条件就说明当前节点不是第一个节点
然后判断当前节点的前驱节点是否是头节点，也就是判断当前节点是否是第二个节点，如果不是那么进入代码块

```java
 if (pred.status < 0) {
        cleanQueue();           // predecessor cancelled
        continue;
    } else if (pred.prev == null) {
        Thread.onSpinWait();    // ensure serialization
        continue;
    }
```

判断，当前节点的前驱节点状态是不是小于 0，如果是则说明当前线程已经是处于取消的状态，那么将它清理出队列，如果当前节点的前驱节点的前驱节点是 null，则说明当前节点已经是拍到了第二个，马上轮到他，这时它会进入自旋等待的状态。

**第二**

```java
if (first || pred == null) {
    boolean acquired;
    try {
        if (shared)
            acquired = (tryAcquireShared(arg) >= 0);
        else
            acquired = tryAcquire(arg);
    } catch (Throwable ex) {
        cancelAcquire(node, interrupted, false);
        throw ex;
    }
    if (acquired) {
        if (first) {
            node.prev = null;
            head = node;
            pred.next = null;
            node.waiter = null;
            if (shared)
                signalNextIfShared(node);
            if (interrupted)
                current.interrupt();
        }
        return 1;
    }
}
```

这里就是当前节点是第一个节点的情况，这里回去尝试获取锁，如果是获取共享锁那么就尝试获得共享锁，否则就去尝试获取排他锁，这里`tryAcquire`就是一个比较交换，代码如下

```java
 protected final boolean tryAcquire(int acquires) {
   if (getState() == 0 && compareAndSetState(0, acquires)) {
       setExclusiveOwnerThread(Thread.currentThread());
       return true;
   }
   return false;
}
```

如果资源是 0 或者比较交换成功，就给当前线程设置排他锁

```java

 if (acquired) {
     if (first) {
         node.prev = null;
         head = node;
         pred.next = null;
         node.waiter = null;
         if (shared)
             signalNextIfShared(node);
         if (interrupted)
             current.interrupt();
     }
     return 1;
 }

```

这里获取锁成功其实就是个出队的操作：

- 设置新的头节点
- 将原来的头节点出队
  之后如果出现中断了，那么线程中断，获取中断标记

**最后一部分**

```java
 if ((t = tail) == null) {           // initialize queue
       if (tryInitializeHead() == null)
           return acquireOnOOME(shared, arg);
   } else if (node == null) {          // allocate; retry before enqueue
       try {
           node = (shared) ? new SharedNode() : new ExclusiveNode();
       } catch (OutOfMemoryError oome) {
           return acquireOnOOME(shared, arg);
       }
   } else if (pred == null) {          // try to enqueue
       node.waiter = current;
       node.setPrevRelaxed(t);         // avoid unnecessary fence
       if (!casTail(t, node))
           node.setPrevRelaxed(null);  // back out
       else
           t.next = node;
   } else if (first && spins != 0) {
       --spins;                        // reduce unfairness on rewaits
       Thread.onSpinWait();
   } else if (node.status == 0) {
       node.status = WAITING;          // enable signal and recheck
   } else {
       long nanos;
       spins = postSpins = (byte)((postSpins << 1) | 1);
       if (!timed)
           LockSupport.park(this);
       else if ((nanos = time - System.nanoTime()) > 0L)
           LockSupport.parkNanos(this, nanos);
       else
           break;
       node.clearStatus();
       if ((interrupted |= Thread.interrupted()) && interruptible)
           break;
   }
}

```

这一部分相对比较复杂，这里主要是做的其他线程的出入队列的操作

1. 判断队列是否是空的，如果是那么则初始化队列

```java
if ((t = tail) == null) {           // initialize queue
 if (tryInitializeHead() == null)
     return acquireOnOOME(shared, arg);
}
```

2. 判断如果当前节点是null，那么就创建一个Node节点

```java
else if (node == null) {          // allocate; retry before enqueue
    try {
        node = (shared) ? new SharedNode() : new ExclusiveNode();
    } catch (OutOfMemoryError oome) {
        return acquireOnOOME(shared, arg);
    }
}

```

3.

```java
else if (pred == null) {          // try to enqueue
    node.waiter = current;
    node.setPrevRelaxed(t);         // avoid unnecessary fence
    if (!casTail(t, node))
        node.setPrevRelaxed(null);  // back out
    else
        t.next = node;
}
```

尝试将当前线程（current）加入到 AQS 的等待队列的尾部。
使用 CAS（比较并交换）确保线程安全地修改队列的尾部指针。
如果 CAS 操作失败，撤销修改，重新尝试。

4.

```java
 else if (first && spins != 0) {
    --spins;                        // reduce unfairness on rewaits
    Thread.onSpinWait();
} else if (node.status == 0) {
    node.status = WAITING;          // enable signal and recheck
}
```

这里是判断是否为第一个节点，如果是第一个节点并且自旋次数不是0，则减少自旋次数，然后线程编程自旋等待的状态

5.

```java

else if (node.status == 0) {
    node.status = WAITING;          // enable signal and recheck
}

```

这里是判断线程的状态如果状态是0则将装编委等待

否则进入入队的逻辑也就是如下代码

```java
else {
    long nanos;
    spins = postSpins = (byte)((postSpins << 1) | 1);
    if (!timed)
        LockSupport.park(this);
    else if ((nanos = time - System.nanoTime()) > 0L)
        LockSupport.parkNanos(this, nanos);
    else
        break;
    node.clearStatus();
    if ((interrupted |= Thread.interrupted()) && interruptible)
        break;
}
```
