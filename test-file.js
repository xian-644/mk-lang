// 这是一个测试文件，用于测试mk-lang插件的功能
// 请选中下面的中文文本，然后右键选择"mk-lang: 语言替换"

function showMessage() {
  // 选中下面的文本，然后右键替换
  alert("欢迎使用");
  
  // 或者选中下面的文本，然后右键选择模板
  console.log("你好");
  
  // 更多测试文本
  const submitButton = document.getElementById("submit");
  submitButton.innerText = "提交";
  
  const cancelButton = document.getElementById("cancel");
  cancelButton.innerText = "取消";
  
  // 测试长文本
  const message = "发生错误，请稍后再试";
  
  return {
    title: "标题",
    content: "内容",
    status: "状态"
  };
}

class UserProfile {
  constructor() {
    this.welcomeText = "欢迎来到我们的应用";
    this.logoutText = "退出登录";
    this.settingsText = "设置";
  }
  
  showProfile() {
    return "个人资料";
  }
}

// 测试不同位置的中文
const errorMessages = {
  notFound: "未找到",
  serverError: "服务器错误",
  networkError: "网络错误"
};

// 测试行内多个中文
function processForm() {
  validateInput("用户名", "密码", "电子邮箱");
  showStatus("处理中", "已完成", "失败");
}