export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem("chasum-theme");if(t==="dark"||t==="light"){document.documentElement.classList.toggle("dark",t==="dark")}else if(window.matchMedia("(prefers-color-scheme: dark)").matches){document.documentElement.classList.add("dark")}}catch(e){}})()`,
      }}
    />
  );
}
