# AQS

AQS原理说明，以`ReentrantLock`为例

## 创建ReentrantLock对象

```java
   /**
     * Creates an instance of {@code ReentrantLock}.
     * This is equivalent to using {@code ReentrantLock(false)}.
     */
    public ReentrantLock() {
        sync = new NonfairSync();
    }

```

上述代码可以发现他创建了一个非公平锁

这个非公平锁是`ReentrantLock`的一个内部类,内部有两个函数，一个好死初始化获取锁，一个是尝试获取锁，这二者是在调用`lock`函数的时候开始调用，下面细说

```java
    static final class NonfairSync extends Sync {
        private static final long serialVersionUID = 7316153563782823691L;

        final boolean initialTryLock() {
            Thread current = Thread.currentThread();
            if (compareAndSetState(0, 1)) { // first attempt is unguarded
                setExclusiveOwnerThread(current);
                return true;
            } else if (getExclusiveOwnerThread() == current) {
                int c = getState() + 1;
                if (c < 0) // overflow
                    throw new Error("Maximum lock count exceeded");
                setState(c);
                return true;
            } else
                return false;
        }

        /**
         * Acquire for non-reentrant cases after initialTryLock prescreen
         */
        protected final boolean tryAcquire(int acquires) {
            if (getState() == 0 && compareAndSetState(0, acquires)) {
                setExclusiveOwnerThread(Thread.currentThread());
                return true;
            }
            return false;
        }
    }
```

上锁，这里实际上是调用的内部类`Sync`的`lock`函数.

```java
    public void lock() {
        sync.lock();
    }
```

进入`lock`函数

```java
   @ReservedStackAccess
    final void lock() {
        if (!initialTryLock())
            acquire(1);
    }
```

这里发现他调用了`initialTryLock`函数，这个是`Sync`内部类的一个抽象函数，而前面的代码可以发现`NonfairSync`这个类继承了`Sync`这个类，并且重写了`initialTryLock`这个函数，因此这里调用的就是`NonfairSync`的`initialTryLock`函数，下面是这个函数的具体解析

```java
    Thread current = Thread.currentThread();
    if (compareAndSetState(0, 1)) { // first attempt is unguarded
        setExclusiveOwnerThread(current);
        return true;
    } else if (getExclusiveOwnerThread() == current) {
        int c = getState() + 1;
        if (c < 0) // overflow
            throw new Error("Maximum lock count exceeded");
        setState(c);
        return true;
    } else
        return false;
```

这里上来就是获取了当前的线程，然后使用cas来设置状态，0表示当前资源没有资源占用，1表示当前资源有线程占用了。如果成功给你也就是cas成功，那么就会设置当前线程独占资源，也就是`setExclusiveOwnerThread`这个函数。返回true

如果走`else if`这里就是可重入锁，也就是一个线程可以重复获得相同的锁

```java
else if (getExclusiveOwnerThread() == current) {
    int c = getState() + 1;
    if (c < 0) // overflow
        throw new Error("Maximum lock count exceeded");
    setState(c);
    return true;
}
```

这里就是线程重复获得锁的情况，就是吧状态+1，然后< 0的话就说明可能存在超出限制的情况，然后返回true；

出了这两种情况，其余情况都是返回false,也就是尝试获取锁失败

接下来是acquire函数，这个函数虽然叫“获得”，但是实际上这个是一个入队的操作，也就是进入AQS队列，下面是源代码，来自JDK17

```java

final int acquire(Node node, int arg, boolean shared,
                      boolean interruptible, boolean timed, long time) {
    Thread current = Thread.currentThread();
    byte spins = 0, postSpins = 0;   // retries upon unpark of first thread
    boolean interrupted = false, first = false;
    Node pred = null;                // predecessor of node when enqueued

    /*
        * Repeatedly:
        *  Check if node now first
        *    if so, ensure head stable, else ensure valid predecessor
        *  if node is first or not yet enqueued, try acquiring
        *  else if node not yet created, create it
        *  else if not yet enqueued, try once to enqueue
        *  else if woken from park, retry (up to postSpins times)
        *  else if WAITING status not set, set and retry
        *  else park and clear WAITING status, and check cancellation
        */

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
        if (node == null) {                 // allocate; retry before enqueue
            if (shared)
                node = new SharedNode();
            else
                node = new ExclusiveNode();
        } else if (pred == null) {          // try to enqueue
            node.waiter = current;
            Node t = tail;
            node.setPrevRelaxed(t);         // avoid unnecessary fence
            if (t == null)
                tryInitializeHead();
            else if (!casTail(t, node))
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

1. 变量的初始化

```java

Thread current = Thread.currentThread();
byte spins = 0, postSpins = 0;   // 重试次数
boolean interrupted = false, first = false; // 标记是否中断和是否是队列的第一个节点
Node pred = null; // 当前节点的前驱节点


```

第一部分：锁获取的逻辑，实际上就是个死循环

```java
for (;;) {
    // 检查当前节点是否是队列的第一个节点，如果是则尝试获取锁。
    if (!first && (pred = (node == null) ? null : node.prev) != null &&
        !(first = (head == pred))) {
        // 如果前驱节点被取消，则清理队列并继续循环
        if (pred.status < 0) {
            cleanQueue();  // 前驱节点被取消，清理队列
            continue;
        } else if (pred.prev == null) {
            // 如果前驱节点的前驱为空，则调用自旋等待，确保队列节点的序列化
            Thread.onSpinWait();
            continue;
        }
    }


```

首先上来就检查当前的节点是不是队列的第一个节点，如果是的话，说明轮到这个线程获取资源了，这个时候会尝试获取锁

```java
if (!first && (pred = (node == null) ? null : node.prev) != null && !(first = (head == pred)))
```

这里这个条件判断有点复杂，大概三个条件。

1. 第一个条件`!first`用来标记当前节点是不是队列的第一个节点
2. 第二个条件`(pred = (node == null) ? null : node.prev) != null` 这个就是判断当前节点有没有前驱节点如果有会尝试获取。
3. `!(first = (head == pred))`最后一个条件用来判断前驱节点是否为头节点，也就是是不是队列中的第一个节点

满足这个if的条件那么进入，首先会判断当前节点的状态，也就是线程的状态，如果是负数，则说明线程取消获取资源，就类似于有人排队不排了。这个取消逻辑以后再说，先把循环体搞定

如果不进入第一个if，那么执行如下

```java
else if (pred.prev == null) {
    // 如果前驱节点的前驱为空，则调用自旋等待，确保队列节点的序列化
    Thread.onSpinWait();
    continue;
}
```

这里是如果当前节点的前驱节点的前驱节点是空的，通俗点讲，这里就是前面的前面的节点这里差不多处于头节点的位置，那么就相当于轮到这个节点获取资源了，这时他会进行自旋等待的状态。

第二部分:锁获取逻辑

```java

if (first || pred == null) {
    boolean acquired;
    try {
        // 尝试获取共享锁或独占锁
        if (shared)
            acquired = (tryAcquireShared(arg) >= 0);
        else
            acquired = tryAcquire(arg);
    } catch (Throwable ex) {
        cancelAcquire(node, interrupted, false);
        throw ex;
    }
    if (acquired) {
        // 获取锁成功
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
        return 1; // 锁获取成功
    }
}

```

这一套有点复杂，其实就是两部分，如果当前节点没有前驱节点，或者是第一个节点，就好比你去买汉堡，这会儿没人排队，直接就让你获取锁了，以下代码就是

```java
  // 尝试获取共享锁或独占锁
if (shared)
    acquired = (tryAcquireShared(arg) >= 0);
else
    acquired = tryAcquire(arg);
```

之后判断获取锁是否成功，这里看似好像有点脱裤子放屁，明明前面获取了锁了，就已经说明这是第一个头节点了，这里实际判断的是当前线程是不是已经在队列中，一点一点排到第一个的，之前那个没有入队直接获取了锁，所以这里的操作很明显就是个链表的操作。
用麦当劳排队的例子：
你排在第一个（first = true）
柜台空闲了，轮到你点餐（acquired = true）
这时候需要：
你从队伍里出来，站到柜台前（成为head）
移除原来占着柜台的人（老的head）
确保队伍里其他人往前挪（维护队列）

第三步：入队

```java
if (node == null) {  // 还没有节点
    if (shared)
        node = new SharedNode();    // 创建共享节点（比如ReadLock）
    else
        node = new ExclusiveNode(); // 创建独占节点（比如WriteLock）
}
```

如果没有节点创建节点

```java
else if (pred == null) {  // 有号但还没排队
    node.waiter = current;          // 记录是哪个线程在等待
    Node t = tail;                  // 获取队尾
    node.setPrevRelaxed(t);         // 先设置前驱为当前队尾

    if (t == null)                  // 队列是空的
        tryInitializeHead();        // 初始化队列
    else if (!casTail(t, node))     // CAS设置新的队尾
        node.setPrevRelaxed(null);  // 入队失败，清除关系
    else
        t.next = node;              // 入队成功，建立双向链接
}
```

如果当前节点的前驱节点是空的，说明这时这个节点没有入队，这是就需要记录当前是那个线程等待，之后获取链表的尾节点，

如果当前队列是空的，那么就进行队列的初始化，否则就是设置新的对味，也就是获取当前队尾，通过CAS比较并且设置新的队尾节点，之后设置将之前的队尾节点的下一个节点设置为当前节点，本质上就是对味插入的操作

```java

else if (first && spins != 0) {  // 是队首而且还可以自旋
    --spins;                     // 减少自旋次数
    Thread.onSpinWait();         // CPU友好的自旋等待
}
```

这里就是判断如果当前节点是队首节点，并且还在自旋，说白了就是你买汉堡，然后前面那个人还没操作完，但是马上就要轮到你的一个情况，在等待一会儿，而不是直接阻塞。

```java

else if (node.status == 0) {  // 还没设置等待状态
    node.status = WAITING;     // 设置为等待状态
}

```

这里判断当前线程的状态，如果线程状态是0,也就是一个初始化的状态，这里就把它设置为等待状态。

```java


else {  // 前面都不满足，就真正等待
    // 计算自旋次数，下次醒来时用
    spins = postSpins = (byte)((postSpins << 1) | 1);

    if (!timed)  // 不限时等待
        LockSupport.park(this);
    else if ((nanos = time - System.nanoTime()) > 0L)  // 限时等待
        LockSupport.parkNanos(this, nanos);
    else  // 超时了
        break;

    node.clearStatus();  // 清除等待状态

    // 处理等待过程中的中断
    if ((interrupted |= Thread.interrupted()) && interruptible)
        break;
}
```

这里就是真正的等待，如果不限时，那么就用`LockSupport`把它挂起来，限时就限时挂起，如果出现中断那么就跳出当前循环，排队失败。

总结一下，其实以上代码就是一个入队和出队的过程，整体就是个链表

当前线程获取锁，如果资源有人占用，这里就会进入一个死循环，等待获取资源

1. 上来就判断一下，如果你不是头节点，那么自旋等待，也可以中途走人

2. 如果是头节点，并且此时队列是空，那么就直接获取资源，不用入队了，否则就是入队一点一点排到头节点

3. 入队操作，就是个简单的队尾插入节点

4. 最后则是判断线程等待，判断状态进行自旋
