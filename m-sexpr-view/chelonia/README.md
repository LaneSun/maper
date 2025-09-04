# Chelonia

A top-down text parser

Chelonia是使用JavaScript编写的文本解析器, 供作者个人使用, 基于CC0协议进行授权.



## 使用 Chelonia

Chelonia本身以ES模块的形式提供, 同时不依赖于任何环境, 但作为工具提供的`utils.js`需要
使用Fetch API或者是Deno运行时环境. 最简单的情况下, 你可以使用如下代码来加载并使用你的
规则定义文件:

    import {init_converter, load_cmrule} from "./utils.js";
    import {parser} from "./parser.js";
    
    // init the rule converter
    await init_converter();
    
    // load and generate your rule object
    const my_rule = await load_cmrule("path/to/your/rule");
    
    // use your rule to parse some text
    // the text string needs to be converted to array before parsing
    console.log(parser(my_rule, "some text"));



## 项目结构

* `rules/` 一些规则文件, 用于解析文本格式的Chelonia规则定义文件
* `parser.js` 解析器核心文件
* `utils.js` 辅助工具库



## 文件类型

Chelonia规定了一些自己的文件类型来降低解析规则编写难度.

### `cmrule`文件

Chelonia规则定义文件, 你可以编写这些文件来创建自己的解析规则, 语法类似于
[EBNF](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form).

### `cmrule.js`文件

从`cmrule`文件生成的规则中间文件, 你可以使用`cm-compile.js`工具来生成你自己的中间文件.
规则中间文件使用`load_compiled_cmrule`工具函数加载, 可以加快规则的加载速度.

### `packer.js`文件

ES模块文件, 对外暴露`packer`对象, 用于解析过程中的映射处理.



## Chelonia 规则语法

Chelonia规则语法(以下简称CM)文件是由一系列嵌套的定义块组成的, 使用如下形式书写:

    DefineName {
        ...Rules or Defines
    }

一个嵌套的定义块类似于如下格式:

    OuterBlock {
        ...Rules
        InnerBlock {
            ...Rules
        }
    }

在定义块中, 允许包含子定义块或者规则, 规则是如下形式的:

    | ...RuleElements |

规则元素可以是标识符或正则匹配原子, 标识符即代表对应名称定义块的**一次**匹配, 形如:

    | OuterBlock <[a-zA-Z]> |

CM的正则匹配原子与标准的正则匹配并不一样, 它永远都只匹配**一个**字符, 因此定义匹配数量
大于1的正则匹配原子是无意义的, 但你可以使用**变长匹配**来多次匹配

    | <[a-z]> |     // 这个规则匹配所有的小写字符, 一次仅匹配一个
    | <[a-z]>+ |    // 这个是一个变长匹配, 可以匹配1-N个小写字符
    | <[a-z]>? |    // 这同样是变长匹配, 但匹配0-1次
    | <[a-z]>* |    // 这个匹配0-N次
    | <[a-z]>{7} |  // 这是相对高级的写法, 它匹配7-N次
                    // 注意, 此处和标准的正则花括号语法是不一样的
    | <[a-z]>{3,7} |    // 这是更高级的写法, 它匹配3-7次
    | OuterBlock+ |     // 变长匹配同样适用于标识符

在定义块中, 你可以定义多个规则来实现一个**或**匹配操作:

    Block {
        | <[a-z]> |
        | <[A-Z]>+ |
    }

上述定义块匹配一个小写字符或多个大写字符, 除了这种实现方式, 你也可以把一个**圆括号操作符**
和**或运算符**搭配使用来获得类似的效果, 以下的定义和上面是等价的:

    Block {
        | ( <[a-z]> | <[A-Z]>+ ) |
    }

在CM中, 定义块是拥有词法作用域的, 因此标识符不可能指代作用域之外的定义块, 以下定义是非法的:

    BlockA {
        BlockB {
            | <[a-z]> |
        }
    }
    BlockC {
        | BlockB |
    }

同样, 由于作用域隔离, 不相交作用域的相同定义是允许的, 以下定义是合法的:

    BlockA {
        BlockB {
            | <[a-z]> |
        }
    }
    BlockC {
        BlockB {
            | <[A-Z]> |
        }
    }

注意, 即使CM允许这样的定义隔离, 相同名称的定义块依然会共用一个packer函数.

最后, 为了更好地理解CM的结构, 建议查看项目源码的`rules`文件夹下的cmrule文件. 其中,
`chelonia-rule-1.cmrule`和`chelonia-rule-2.cmrule`分别以CM规定了CM文本自身的
第一层和第二层解析规则(CM文件是分两层解析的, 同时Chelonia解析器的输入也并不局限于字符流).



--------------------------------------------------------------------------------

[![CC0](https://licensebuttons.net/p/zero/1.0/88x31.png)](http://creativecommons.org/publicdomain/zero/1.0/)

To the extent possible under law,
<span resource="[_:publisher]" rel="dct:publisher">
  <span property="dct:title">Shadee</span></span>
has waived all copyright and related or neighboring rights to
this work.