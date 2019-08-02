
class Dep{
    constructor(){
        this.subs=[];
    }
    addSub(obj){
        this.subs.push(obj)
    }
    notify(){
        console.log(this.subs)
        this.subs.forEach(val=>{
            val.updata()
        })
    }
}

Dep.target = null;
const dep = new Dep()


class Watcher{
    constructor(data, key, cbk){
        Dep.target = this;
        this.data = data;
        this.key = key;
        this.cbk = cbk;
        this.init();
    }
    init(){
        this.value = utils.getValue(this.data, this.key)
        Dep.target = null;
        return this.value
    }
    updata(){
        let newVal = this.init()
        this.cbk(newVal)
    }
}


class Observer{
    constructor(data){
        if(!data||typeof data !== 'object'){
            return;
        }
        this.data = data;
        this.init()
    }
    init(){
        Object.keys(this.data).forEach(key=>{
            this.dataHijack(this.data, key, this.data[key])
        })
    }
    dataHijack(obj, key, value){
        console.log(obj[key])
        new Observer(obj[key])
        Object.defineProperty(obj, key, {
            get(){
                if(Dep.target){
                    dep.addSub(Dep.target)
                }
                return value;
            },
            set(newValue){
                if(value === newValue) {
                    return;
                }
                value = newValue
                dep.notify()
                new Observer(value)   //当新值是一个对象的时候再次添加劫持，保证所有的数据都添加劫持
            }
        })
    }
}


const utils = {
    getValue(data, key) {   
        if(key.indexOf('.') > -1) {   //判断绑定的属性是一级还是更深层级
            // console.log(key.split('.'))
            let arr = key.split('.')
            for(var i=0;i<arr.length;i++) {
                data = data[arr[i]]
            }
            return data
        } else {
            return data[key]  // 一级直接返回进行赋值
        }
    },
    changeValue(data, key, newVal){
        if(key.indexOf('.') > -1) {   //判断绑定的属性是一级还是更深层级
            // console.log(key.split('.'))
            let arr = key.split('.')
            for(var i=0;i<arr.length-1;i++) {
                data = data[arr[i]]
            }
            data[arr[arr.length-1]] = newVal
        } else {
            data[key] = newVal
        }
    }
}


class Mvvm{
    constructor({el, data}){
        this.el = el;
        this.data = data;
        this.init()   
        this.tofragment();
    }
    init(){
        Object.keys(this.data).forEach(key=>{
            this.dataHijack(this, key, this.data[key])
        })
        new Observer(this.data)   //data中的所有属性添加Object.defineProperty()劫持
    }
    dataHijack(obj, key, value){  
        Object.defineProperty(obj, key, {
            get() {
                return value;
            },
            set(newValue) {
                value = newValue
            }
        })
    }
    tofragment(){
        this.$el = document.getElementById(this.el)
        let frag = document.createDocumentFragment();    //创建一个虚拟的节点对象 文档碎片节点(避免文档的多次插入引起重新渲染,一并添加再渲染)
        let child;
        while(child = this.$el.firstChild) {   //firstChild属性返回被选节点的第一个子节点
            // console.dir(child)
            this.compileElement(child)
            frag.appendChild(child)
        }
        this.$el.appendChild(frag)
    }
    compileElement(node){
        let reg = /{{(.*)}}/;   //正则匹配花括号
        if(node.nodeType === 1) {
            let attrs = Array.from(node.attributes)
            console.log(attrs)
            attrs.forEach(item=>{
                if(item.nodeName === 'v-model') {
                    let valueName = item.nodeValue   //获取绑定的属性
                    node.addEventListener('input', e=>{
                        utils.changeValue(this.data, valueName, e.target.value)
                    })
                    // console.log(this.data[valueName])   //属性值
                    node.value = utils.getValue(this.data, valueName)
                }
            })
        }else if(node.nodeType === 3){
            let worldvalue = node.nodeValue
            if(reg.test(worldvalue)) {    //test正则表达式的一个方法，是返回true，相反
                let name = RegExp.$1;
                node.textContent = utils.getValue(this.data, name)
                name && new Watcher(this.data, name, (newVal) =>{
                    node.textContent = newVal
                })
            }
        }
        if (node.childNodes && node.childNodes.length > 0) {
            node.childNodes.forEach(val => {
                this.compileElement(val)
            })
        }
    }
}

