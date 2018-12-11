import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

import "element-theme-default";

if (module.hot) {
  module.hot.accept();
}

ReactDOM.render(<App />, document.getElementById("root"));
