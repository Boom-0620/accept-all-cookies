import { drawIconTo } from './art.js';

const STORE='cookie-pc-files-v1';
const initialFiles=[
  {id:'welcome',name:'欢迎使用.txt',folder:'documents',text:'欢迎使用 COOKIE PC！\n\n这里是你的个人文档。\n可以在记事本中编辑和保存，也可以把文件移到回收站。\n\n祝你拥有愉快的一天。'},
  {id:'recipe',name:'黄油曲奇配方.txt',folder:'documents',text:'黄油曲奇 · 家庭配方\n====================\n黄油 100 g\n糖粉 40 g\n低筋面粉 140 g\n鸡蛋液 20 g\n\n将黄油与糖粉拌匀，加入蛋液，再筛入面粉。\n整形后烤至边缘金黄。\n\n备注：记得留一块给自己。'},
  {id:'notes',name:'今日便签.txt',folder:'documents',text:'1995 / 10 / 24\n\n[ ] 整理桌面\n[ ] 看看新收到的游戏\n[ ] 给曲奇罐补货\n'},
  {id:'draft',name:'旧便签.txt',folder:'bin',text:'旧便签\n\n别忘了备份文档。\n这张便签还可以从回收站还原。'},
];
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const folders={
  computer:{name:'My Computer',path:'My Computer',parent:null,icon:'computer',description:'查看本机的磁盘、文件和文件夹。'},
  c:{name:'Local Disk (C:)',path:'C:\\',parent:'computer',icon:'drive',description:'本地硬盘\n容量：1.2 GB\n可用空间：958 MB'},
  documents:{name:'My Documents',path:'C:\\My Documents',parent:'c',icon:'folder',description:'保存信件、配方和日常便签的地方。'},
  windows:{name:'Windows',path:'C:\\WINDOWS',parent:'c',icon:'folder',description:'COOKIE OS 95 系统目录。'},
  programs:{name:'Program Files',path:'C:\\Program Files',parent:'c',icon:'folder',description:'已安装的应用程序。'},
  cd:{name:'COOKIE CD (D:)',path:'D:\\',parent:'computer',icon:'disc',description:'只读光盘\nCOOKIE QUEST 安装光盘'},
  bin:{name:'Recycle Bin',path:'Recycle Bin',parent:null,icon:'bin',description:'暂存已删除的文件。可以还原或清空。'},
};

export class ClassicApps {
  constructor(desktop) {
    this.desktop=desktop;this.wm=desktop.wm;this.windows=new Map();
    this.state={files:initialFiles.map(f=>({...f})),messages:[]};
    try {
      const saved=JSON.parse(localStorage.getItem(STORE));
      if(saved&&Array.isArray(saved.files)&&saved.files.every(f=>typeof f.id==='string'&&typeof f.name==='string'&&typeof f.text==='string'&&['documents','bin','deleted'].includes(f.folder))) {
        this.state.files=saved.files;
        if(Array.isArray(saved.messages))this.state.messages=saved.messages.filter(m=>typeof m.name==='string'&&typeof m.text==='string').slice(-10);
      }
    } catch {}
  }

  save() {
    let stored=true;
    try {localStorage.setItem(STORE,JSON.stringify(this.state));}catch {stored=false;}
    for(const win of this.windows.values())win.refreshFiles?.();
    return stored;
  }

  appWindow(key,options) {
    const existing=this.windows.get(key);
    if(existing?.el.isConnected){this.wm.restore(existing);return {win:existing,fresh:false};}
    const win=this.wm.create({...options,onClose:()=>this.windows.delete(key)});
    win.el.classList.add('classic-app');win.el.setAttribute('role','dialog');win.el.setAttribute('aria-label',options.title);
    this.windows.set(key,win);return {win,fresh:true};
  }

  icon(kind) {
    if(['drive','disc','floppy','text'].includes(kind)) {
      const span=document.createElement('span');span.className='file-glyph glyph-'+kind;span.setAttribute('aria-hidden','true');return span;
    }
    const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');drawIconTo(canvas,kind);return canvas;
  }

  message(title,text) {
    const {win,fresh}=this.appWindow('message-'+title,{title,x:260,y:175,w:350,h:190,taskbar:false});
    if(!fresh)return;
    const body=document.createElement('div');body.className='classic-message';
    const copy=document.createElement('p');copy.textContent=text;
    const ok=document.createElement('button');ok.className='q-btn';ok.textContent='确定';ok.onclick=()=>this.wm.close(win);
    body.append(copy,ok);win.body.append(body);ok.focus();
  }

  openExplorer(initial='computer') {
    const {win,fresh}=this.appWindow('explorer-'+initial,{title:folders[initial].name,icon:folders[initial].icon,x:155,y:64,w:600,h:405,resizableMax:true});
    if(!fresh){win.navigate(initial);return;}
    win.body.innerHTML=`<div class="classic-menubar"><span>File</span><span>Edit</span><span>View</span><span>Help</span></div>
      <div class="classic-toolbar"><button class="q-btn" data-action="back">← 后退</button><button class="q-btn" data-action="up">↑ 上一级</button><button class="q-btn" data-action="properties">属性</button><span class="toolbar-spacer"></span><button class="q-btn bin-action" data-action="restore">全部还原</button><button class="q-btn bin-action" data-action="empty">清空回收站</button></div>
      <div class="classic-address"><span>Address</span><output></output></div>
      <div class="explorer-main"><aside class="explorer-sidebar"></aside><div class="explorer-files"></div></div><div class="classic-status" role="status"></div>`;
    let location=initial,history=[initial];
    const q=s=>win.body.querySelector(s);
    const go=(next,push=true)=>{location=next;if(push&&history.at(-1)!==next)history.push(next);render();};
    const items=()=>{
      if(location==='computer')return [
        {name:'3½ Floppy (A:)',kind:'floppy',open:()=>this.message('3½ Floppy (A:)','请将软盘插入驱动器 A:。')},
        {name:'Local Disk (C:)',kind:'drive',open:()=>go('c')},
        {name:'COOKIE CD (D:)',kind:'disc',open:()=>go('cd')},
      ];
      if(location==='c')return ['windows','programs','documents'].map(id=>({name:folders[id].name,kind:'folder',open:()=>go(id)}));
      if(location==='windows')return [{name:'WIN.INI',kind:'text',open:()=>this.openNote({id:'winini',name:'WIN.INI',text:'[windows]\nload=\nrun=\n\n[desktop]\nwallpaper=(None)\npattern=(None)\n\n[CookiePC]\nVersion=95\n'},true)}];
      if(location==='programs')return [{name:'COOKIE QUEST.exe',kind:'castle',open:()=>this.desktop.launchGame()},{name:'Internet Explorer',kind:'globe',open:()=>this.openInternet()}];
      if(location==='cd')return [{name:'COOKIE QUEST.exe',kind:'castle',open:()=>this.desktop.launchGame()},{name:'README.TXT',kind:'text',open:()=>this.openNote({id:'cd-readme',name:'README.TXT',text:'COOKIE QUEST\n曲奇美食王国大冒险\n\n方向键 / A D：移动\n空格 / W / 上：跳跃，可二段跳\nESC：暂停\nM：静音\n\n祝你旅途愉快！'},true)}];
      return this.state.files.filter(f=>f.folder===location).map(f=>({name:f.name,kind:'text',open:()=>location==='bin'?this.restoreFile(f):this.openNote(f)}));
    };
    const render=()=>{
      const folder=folders[location];this.wm.setTitle(win,folder.name);q('.classic-address output').textContent=folder.path;
      const side=q('.explorer-sidebar');side.replaceChildren(this.icon(folder.icon));
      const heading=document.createElement('h3');heading.textContent=folder.name;
      const description=document.createElement('p');description.textContent=folder.description;side.append(heading,description);
      const list=q('.explorer-files');list.replaceChildren();const contents=items();
      for(const item of contents) {
        const button=document.createElement('button');button.className='file-item';
        const label=document.createElement('span');label.textContent=item.name;button.append(this.icon(item.kind),label);button.onclick=()=>{this.desktop.audio.click();item.open();};list.append(button);
      }
      if(!contents.length){const empty=document.createElement('p');empty.className='folder-empty';empty.textContent=location==='bin'?'回收站是空的。':'此文件夹为空。';list.append(empty);}
      q('[data-action="back"]').disabled=history.length<2;q('[data-action="up"]').disabled=!folder.parent;
      win.body.querySelectorAll('.bin-action').forEach(b=>{b.hidden=location!=='bin';b.disabled=!contents.length;});
      q('.classic-status').textContent=contents.length+' 个对象'+(location==='bin'&&contents.length?' · 点击文件可还原':'');
    };
    q('[data-action="back"]').onclick=()=>{if(history.length>1){history.pop();go(history.at(-1),false);}};
    q('[data-action="up"]').onclick=()=>{if(folders[location].parent)go(folders[location].parent);};
    q('[data-action="properties"]').onclick=()=>this.message(folders[location].name+' 属性',folders[location].description+'\n\n位置：'+folders[location].path);
    q('[data-action="restore"]').onclick=()=>{this.state.files.filter(f=>f.folder==='bin').forEach(f=>f.folder='documents');this.save();};
    q('[data-action="empty"]').onclick=()=>{this.state.files.filter(f=>f.folder==='bin').forEach(f=>f.folder='deleted');this.save();};
    win.navigate=go;win.refreshFiles=render;render();
  }

  restoreFile(file) {file.folder='documents';this.save();this.message('还原文件',file.name+' 已还原到 My Documents。');}

  openNote(file,readonly=false) {
    const title=file.name+' - Notepad';
    const {win,fresh}=this.appWindow('note-'+file.id,{title,icon:'folder',x:190,y:88,w:540,h:370});if(!fresh)return;
    win.body.innerHTML=`<div class="classic-menubar"><span>File</span><span>Edit</span><span>Search</span><span>Help</span></div><div class="classic-toolbar"><button class="q-btn" data-action="save">保存</button><button class="q-btn" data-action="undo">还原</button><span class="toolbar-spacer"></span><button class="q-btn" data-action="delete">移到回收站</button></div><textarea class="notepad-sheet" spellcheck="false" aria-label="文档内容"></textarea><div class="classic-status" role="status"></div>`;
    const sheet=win.body.querySelector('textarea'),status=win.body.querySelector('.classic-status');sheet.value=file.text;sheet.readOnly=readonly;status.textContent=readonly?'只读文档':'就绪';
    const save=()=>{if(readonly)return;file.text=sheet.value;const stored=this.save();this.wm.setTitle(win,title);status.textContent=stored?'文档已保存':'已保存到本次会话';};
    win.body.querySelector('[data-action="save"]').onclick=save;
    win.body.querySelector('[data-action="undo"]').onclick=()=>{sheet.value=file.text;this.wm.setTitle(win,title);status.textContent='已还原到上次保存';};
    win.body.querySelector('[data-action="delete"]').onclick=()=>{file.folder='bin';this.save();this.wm.close(win);};
    win.body.querySelectorAll('.classic-toolbar button').forEach(b=>b.disabled=readonly);
    sheet.oninput=()=>{this.wm.setTitle(win,'* '+title);status.textContent='尚未保存';};
    sheet.onkeydown=e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save();}};
  }

  openInternet() {
    const {win,fresh}=this.appWindow('internet',{title:'Internet Explorer',icon:'globe',x:80,y:36,w:704,h:480,resizableMax:true});if(!fresh)return;
    win.body.innerHTML=`<div class="classic-menubar"><span>File</span><span>Edit</span><span>View</span><span>Go</span><span>Favorites</span><span>Help</span></div>
      <div class="classic-toolbar"><button class="q-btn" data-browser="back">← Back</button><button class="q-btn" data-browser="forward">Forward →</button><button class="q-btn" data-browser="home">Home</button><button class="q-btn" data-browser="refresh">Refresh</button></div>
      <form class="classic-address browser-address"><label for="retro-address">Address</label><input id="retro-address" aria-label="网页地址" spellcheck="false"><button class="q-btn" type="submit">Go</button></form><div class="retro-webpage"></div><div class="classic-status" role="status">Done</div>`;
    const q=s=>win.body.querySelector(s),page=q('.retro-webpage'),address=q('input');
    let history=['index.htm'],cursor=0;
    const titles={'index.htm':'Welcome to Cookie Net!','recipes.htm':'The Recipe Box','help.htm':'Internet Help','guestbook.htm':'Guest Book'};
    const navigate=(route,push=true)=>{
      if(push){history=history.slice(0,cursor+1);history.push(route);cursor++;}
      render();
    };
    const link=(route,label)=>`<a href="${route}" data-page="${route}">${label}</a>`;
    const render=()=>{
      const route=history[cursor];address.value='http://www.cookie.test/'+route;
      this.wm.setTitle(win,(titles[route]||'Page not found')+' - Internet Explorer');
      q('[data-browser="back"]').disabled=cursor===0;q('[data-browser="forward"]').disabled=cursor===history.length-1;
      const navigation=`<nav>${link('index.htm','Home')} | ${link('recipes.htm','Recipes')} | ${link('guestbook.htm','Guest Book')} | ${link('help.htm','Help')}</nav><hr>`;
      if(route==='index.htm')page.innerHTML=`<div class="web-home"><div class="web-welcome">WELCOME TO</div><h1>COOKIE NET</h1><p><i>Your little corner of the World Wide Web.</i></p><hr><p>欢迎来到曲奇网络！请选择一个页面开始浏览。</p><table class="web-directory"><tbody><tr><td>${link('recipes.htm','The Recipe Box')}<small>黄油曲奇、烘焙小记</small></td><td>${link('guestbook.htm','Sign My Guest Book')}<small>留下你的名字和留言</small></td></tr><tr><td>${link('help.htm','New to the Internet?')}<small>网络新手使用指南</small></td><td>${link('index.htm','Back to Home')}<small>Cookie Net 个人主页</small></td></tr></tbody></table><p class="web-counter">YOU ARE VISITOR <b>001995</b></p><div class="web-badges"><span>NETSCAPE<br><strong>NOW!</strong></span><span>BEST VIEWED<br><strong>800 × 600</strong></span><span>MADE WITH<br><strong>NOTEPAD</strong></span></div><hr><small>Last updated: October 24, 1995 · Cookie Net</small></div>`;
      else if(route==='recipes.htm')page.innerHTML=navigation+`<h1>The Recipe Box</h1><p>一份手写配方，一杯热茶，一个安静的下午。</p><h2>Butter Cookies</h2><table class="recipe-table"><tr><th>材料</th><th>用量</th></tr><tr><td>黄油</td><td>100 g</td></tr><tr><td>糖粉</td><td>40 g</td></tr><tr><td>低筋面粉</td><td>140 g</td></tr><tr><td>鸡蛋液</td><td>20 g</td></tr></table><p>拌匀黄油与糖粉，加入蛋液，再筛入面粉。整形后烤至边缘金黄。</p><p><button class="web-text-link" data-open-recipe>在记事本中打开配方</button></p>`;
      else if(route==='help.htm')page.innerHTML=navigation+`<h1>Welcome to the Internet</h1><h2>How to browse</h2><p>蓝色带下划线的文字是链接，点击它即可打开新页面。</p><p><b>Back / Forward</b>：返回看过的页面，或继续向前。</p><p><b>Home</b>：回到 Cookie Net 首页。</p><p><b>Address</b>：输入本站页面地址后按 Enter。</p><h2>Our pages</h2><p>index.htm · recipes.htm · guestbook.htm · help.htm</p>`;
      else if(route==='guestbook.htm') {
        page.innerHTML=navigation+`<h1>My Guest Book</h1><p>Thanks for stopping by! 留下一句话吧。</p><form class="guestbook-form"><label>Your name <input name="guest-name" maxlength="30" required></label><label>Message <textarea name="guest-message" rows="2" maxlength="300" required></textarea></label><button type="submit">Sign Guest Book</button></form><div class="guestbook-entries">${this.state.messages.map(m=>`<p><b>${escapeHTML(m.name)}</b><br>${escapeHTML(m.text)}</p>`).join('')||'<p><i>Be the first visitor to sign the guest book.</i></p>'}</div>`;
        page.querySelector('form').onsubmit=e=>{e.preventDefault();const name=page.querySelector('[name="guest-name"]').value.trim(),text=page.querySelector('[name="guest-message"]').value.trim();if(!name||!text)return;this.state.messages.push({name,text});this.state.messages=this.state.messages.slice(-10);const stored=this.save();render();q('.classic-status').textContent=stored?'留言已保存在这台电脑上':'留言已保存在本次会话';};
      } else page.innerHTML=`<h1>The page cannot be displayed</h1><p>没有找到这个页面。请检查地址后再试一次。</p><p>${link('index.htm','Return to Cookie Net')}</p>`;
      page.scrollTop=0;q('.classic-status').textContent='Done';
      page.querySelectorAll('[data-page]').forEach(a=>a.onclick=e=>{e.preventDefault();navigate(a.dataset.page);});
      const recipe=page.querySelector('[data-open-recipe]');if(recipe)recipe.onclick=()=>{const file=this.state.files.find(f=>f.id==='recipe');if(file?.folder==='documents')this.openNote(file);else this.message('配方文档','配方文档已移至回收站，可在回收站中还原。');};
    };
    q('[data-browser="back"]').onclick=()=>{if(cursor>0){cursor--;render();}};
    q('[data-browser="forward"]').onclick=()=>{if(cursor<history.length-1){cursor++;render();}};
    q('[data-browser="home"]').onclick=()=>navigate('index.htm');
    q('[data-browser="refresh"]').onclick=render;
    q('.browser-address').onsubmit=e=>{e.preventDefault();let value=address.value.trim();value=value.replace(/^https?:\/\/www\.cookie\.test\/?/i,'').replace(/^\//,'');navigate(value||'index.htm');};
    render();
  }
}
