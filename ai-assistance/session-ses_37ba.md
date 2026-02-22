# Multi-agent workflow for AkashaCMS development

**Session ID:** ses_37ba2bafcffeB4wYKTyj8qgKv4
**Created:** 2/22/2026, 10:00:30 AM
**Updated:** 2/22/2026, 11:22:22 AM

---

## User

I want to create three agent descriptions which work together for software development.  They must loop back to each other as requirements are defined, code is written, code is tested, and the results validated against the requirements.  That way the agents can iterate between themselves to ensure the resulting code is correct.  The first agent is "Program Manager" who is an experienced program manager, tracking requirements, making sure the requirements are complete, and so forth.  The second is "Builder", who is experienced in Node.js, TypeScript, the architecture of AkashaCMS, coding with template engines and DOM processing using Mahabhuta.  The third is "Quality Assurance", who is also experienced in the same things as the BUilder, but is looking at all ways of using each API, creating tests to cover those uses as well as misuses, validating that each API is fully tested.  When the Builder writes some code and declares it finished, the Quality Assurance agent must inspect the new code, write tests (if needed), run the tests, and loop back to the Builder if there are test failures.  A fourth agent is "Code Reviewer" whose job is to inspect the code written by Builder to do sanity checks and architectural checks.  The process is for Builder to hand the code to Code Reviewer who then hands it to Quality Assurance.  The Code Reviewer is also experienced in the same technologies as Builder, but is strict about clean code, architectural correctness, sanity checking the code.  The Code Reviewer can also loop back to Builder if the code didn't look right.  The Program Manager reviews the resulting code after Quality Assurance agrees to the development, and the Program Manager is reviewing the code to ensure it met the requirements.  If not, the Program Manager sends it back to the Builder.  The Agents must be implemented in a fashion which disposes of unneeded context memory after each agent execution.  How do I implement this as Agent descriptions for OpenCode?

---

## Assistant (Build · claude-opus-4-5 · 5.4s)

I'll help you design a multi-agent system for OpenCode that implements this collaborative software development workflow. Let me first research how OpenCode agents work and then create the agent descriptions.

**Tool: glob**

**Input:**
```json
{
  "pattern": "**/.opencode/**"
}
```

**Output:**
```
/home/david/Projects/akasharender/akasharender/.opencode/bun.lock
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/@opencode-ai/plugin/dist/tool.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/@opencode-ai/plugin/dist/tool.js
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/@opencode-ai/plugin/dist/example.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/@opencode-ai/plugin/dist/shell.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/@opencode-ai/plugin/dist/example.js
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/@opencode-ai/plugin/dist/index.js
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/@opencode-ai/sdk/dist/v2/index.js
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/@opencode-ai/sdk/dist/v2/server.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/@opencode-ai/sdk/dist/v2/index.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/@opencode-ai/sdk/dist/index.js
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/@opencode-ai/sdk/dist/server.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/@opencode-ai/sdk/dist/index.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/@opencode-ai/sdk/dist/v2/client.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/@opencode-ai/sdk/dist/v2/client.js
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/@opencode-ai/sdk/dist/client.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/@opencode-ai/sdk/dist/client.js
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/@opencode-ai/sdk/package.json
/home/david/Projects/akasharender/akasharender/.opencode/package.json
/home/david/Projects/akasharender/akasharender/.opencode/command/build.md
/home/david/Projects/akasharender/akasharender/.opencode/command/test.md
/home/david/Projects/akasharender/akasharender/.opencode/.gitignore
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/ZodError.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/types.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/helpers/typeAliases.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/helpers/util.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v4/locales/ua.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/standard-schema.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v4/locales/ru.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v4/locales/ta.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/helpers/partialUtil.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/helpers/parseUtil.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/locales/index.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/index.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v4-mini/index.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/index.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/external.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/locales/en.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/errors.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/helpers/errorUtil.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/helpers/enumUtil.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/README.md
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v4-mini/package.json
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v4/locales/az.d.ts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/locales/package.json
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/package.json
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/package.json
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/ZodError.js
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/types.js
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/standard-schema.js
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/helpers/partialUtil.js
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/helpers/typeAliases.js
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/helpers/util.js
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/locales/index.js
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v4-mini/index.js
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/external.js
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/index.js
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/helpers/parseUtil.js
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/helpers/errorUtil.js
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v4/locales/nl.js
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/ZodError.d.cts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/types.d.cts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/locales/en.js
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/errors.js
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/helpers/typeAliases.d.cts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/helpers/util.d.cts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/helpers/enumUtil.js
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v4/locales/az.js
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/index.d.cts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/locales/index.d.cts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/index.d.cts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v4-mini/index.d.cts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/standard-schema.d.cts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v4/index.d.cts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/helpers/parseUtil.d.cts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/helpers/partialUtil.d.cts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v4/locales/pl.d.cts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/external.d.cts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/locales/en.d.cts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/ZodError.cjs
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/errors.d.cts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/helpers/errorUtil.d.cts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/helpers/enumUtil.d.cts
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/helpers/util.cjs
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v4/locales/ua.cjs
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/standard-schema.cjs
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/types.cjs
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/helpers/parseUtil.cjs
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/helpers/typeAliases.cjs
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/helpers/partialUtil.cjs
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/locales/index.cjs
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/external.cjs
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v4-mini/index.cjs
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/errors.cjs
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/locales/en.cjs
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/index.cjs
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/helpers/enumUtil.cjs
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/v3/helpers/errorUtil.cjs
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/index.cjs
/home/david/Projects/akasharender/akasharender/.opencode/node_modules/zod/LICENSE

(Results are truncated: showing first 100 results. Consider using a more specific path or pattern.)
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "**/agents.json"
}
```

**Output:**
```
No files found
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "**/.opencode*"
}
```

**Output:**
```
No files found
```

---

## Assistant (Build · claude-opus-4-5 · 4.3s)

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/david/Projects/akasharender/akasharender/.opencode"
}
```

**Output:**
```
<path>/home/david/Projects/akasharender/akasharender/.opencode</path>
<type>directory</type>
<entries>
.gitignore
bun.lock
command/
node_modules/
package.json

(5 entries)
</entries>
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "**/opencode.json"
}
```

**Output:**
```
No files found
```

---

## Assistant (Build · claude-opus-4-5 · 5.7s)

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/david/Projects/akasharender/akasharender/.opencode/command"
}
```

**Output:**
```
<path>/home/david/Projects/akasharender/akasharender/.opencode/command</path>
<type>directory</type>
<entries>
build.md
test.md

(2 entries)
</entries>
```

**Tool: invalid**

**Input:**
```json
{
  "tool": "web_search_prime_webSearchPrime",
  "error": "Model tried to call unavailable tool 'web_search_prime_webSearchPrime'. Available tools: invalid, question, bash, read, glob, grep, edit, write, task, webfetch, todowrite, skill, web-search-prime_webSearchPrime, web-reader_webReader."
}
```

**Output:**
```
The arguments provided to the tool are invalid: Model tried to call unavailable tool 'web_search_prime_webSearchPrime'. Available tools: invalid, question, bash, read, glob, grep, edit, write, task, webfetch, todowrite, skill, web-search-prime_webSearchPrime, web-reader_webReader.
```

---

## Assistant (Build · claude-opus-4-5 · 8.1s)

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/david/Projects/akasharender/akasharender/.opencode/command/build.md"
}
```

**Output:**
```
<path>/home/david/Projects/akasharender/akasharender/.opencode/command/build.md</path>
<type>file</type>
<content>1: ---
2: description: Build AkashaRender source
3: agent: build
4: ---
5: 
6: Building AkashaRender is done using npm to run the TypeScript command.
7: 
8: To rebuild the package, the following command should be used
9: 
10: [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && nvm use 24 && npm run build
11: 
12: 

(End of file - total 12 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/david/Projects/akasharender/akasharender/.opencode/command/test.md"
}
```

**Output:**
```
<path>/home/david/Projects/akasharender/akasharender/.opencode/command/test.md</path>
<type>file</type>
<content>1: ---
2: description: Run tests with coverage
3: agent: build
4: ---
5: 
6: Run the full test suite, showing errors.  The test suite is located in the test subdirectory, and is several Mocha+Chai test suites.  An additional test is to use AkashaRender to render a test site.
7: 
8: To run the test suite, the following command should be used
9: 
10: [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && nvm use 24 && cd test && npm run test
11: 
12: 

(End of file - total 12 lines)
</content>
```

**Tool: web-search-prime_webSearchPrime**

**Input:**
```json
{
  "search_query": "opencode agents configuration multi-agent workflow"
}
```

**Output:**
```
"[{\"refer\":\"ref_1\",\"title\":\"PAI 2.4 (Personal AI Infrastructure) ported to OpenCode - GitHub\",\"link\":\"https://github.com/Steffen025/pai-opencode\",\"media\":\"\",\"content\":\"If you have an existing\\\"~/.opencode\\\"directory, see Existing OpenCode Users in the Installation Guide for symlink setup.\\nPAI-OpenCode includes a 3-tier research system that optimizes for both quality and cost:\\n| Tier | Workflow | Agents | Cost | Trigger |\\n|---|---|---|---\\nduring setup.\",\"icon\":\"\",\"publish_date\":\"2026-01-24\"},{\"refer\":\"ref_2\",\"title\":\"Kocoro-lab/Shannon: A production-oriented multi-agent ...\",\"link\":\"https://github.com/Kocoro-lab/Shannon\",\"media\":\"\",\"content\":\".\\n| The Problem | Shannon's Solution |\\n|---|---|\\n| Agents fail silently?\\n- `config/features.yaml`— Feature toggles, workflow settings\\n- `config/opa/policies/`— Access control rules See Configuration Guide for details.\\nStart shipping reliable agents.** GitHub · Docs · X\",\"icon\":\"\",\"publish_date\":\"2025-08-28\"},{\"refer\":\"ref_3\",\"title\":\"Claude-Code-Multi-Agent开源，强大的claude code Subagent工作流\",\"link\":\"https://m.toutiao.com/a7535390503094534694/\",\"media\":\"\",\"content\":\"多代理并行协作时的上下文传递 大型代码库的分析和重构 复杂架构设计的迭代优化 全面的测试套件生成和验证\\n建议在使用前：\\n设置合理的token使用限制 优先处理关键功能模块 合理根据自身需求使用不同复杂度的工作流\\n推荐MCP协同配置以达最佳效果\\n为了充分发挥 Claude-Code-Multi-Agent 系统的全部潜力，我们强烈建议配置  模型上下文协议 。通过启用一系列协同工作的MCP服务器，您可以为AI代理提供与外部世界交互、长期记忆、浏览器自动化等高级能力，从而实现更复杂、更可靠的自动化开发工作流。\\n配置方法\\n请将以下 mcpServers 配置代码块添加到您的\\n.claude/settings.local.json 文件中。如果文件不存在，请创建一个。\",\"icon\":\"\",\"publish_date\":\"2025-08-06\"},{\"refer\":\"ref_4\",\"title\":\"Fork of openagent that adds support for custom agent and ...\",\"link\":\"https://github.com/mpazik/openagent\",\"media\":\"\",\"content\":\"\\\"openagent logo\\\" ()\\nOpen source solution for Context and Workflow Engineering.\\n/agents';\\nexport default { // your existing opencode configuration agents: [prototypeAgent, implementerAgent, qaAgent]\\n}\\n3.\\n, prevents agents from writing to unauthorized files\\n- refresh - Refreshes the file given in the configuration, useful if the file was modified by someone\",\"icon\":\"\",\"publish_date\":\"2025-07-06\"},{\"refer\":\"ref_5\",\"title\":\"构建多代理系统：从架构设计到落地实践的完整指南（附代码解析）\",\"link\":\"https://www.51cto.com/aigc/6165.html\",\"media\":\"\",\"content\":\"工具通过底层应用程序或系统的 API 扩展代理的能力。对于没有 API 的遗留系统，代理可以依靠计算机使用模型通过 Web 和应用程序界面直接与这些系统交互，就像人类一样。每个工具都应有标准化定义，以实现工具与代理之间灵活的多对多关系。文档完善、经过充分测试和可重用的工具可以提高可发现性，简化版本管理，并避免重复定义。\\n概括来说，代理需要三种类型的工具：\\n例如，以下是使用 Agents SDK 为上述代理配置一系列工具的示例：\\nfrom agents import Agent, WebSearchTool, function_tool @function_tool def save_results(output):         db.insert({\\\"output\\\": output, \\\"timestamp\\\": datetime.time()})         return \\\"File saved\\\" search_agent = Agent(         name=\\\"Search agent\\\",         instructinotallow=\\\"Help the user search the internet and save results if asked.\\\",         tools=[WebSearchTool(), save_results], )\\n1. 2. 3. 4. 5. 6. 7. 8. 9. 10.\\n复制\\n当所需工具数量增加时，可考虑将任务分配给多个代理。\\n2.3 配置指令\\n高质量的指令对任何 LLM 驱动的应用程序都至关重要，对代理而言更是如此。清晰的指令可以减少歧义，改善代理的决策，从而实现更流畅的工作流执行和更少的错误。\\n可以使用高级模型（如 o1 或 o3-mini）从现有文档自动生成指令。以下是说明该方法的示例提示：\\n3. 编排\\n在基础组件就绪后，即可考虑编排模式，使代理能够高效执行工作流。\\n多代理系统可以建模为图，代理表示为节点。在管理者和监督者模式中，边表示工具调用；而在去中心化和群体模式中，边表示代理之间的执行交接。\\nAI 代理的工作流程通常遵循以下 4 个步骤：\",\"icon\":\"\",\"publish_date\":\"2025-06-19\"},{\"refer\":\"ref_6\",\"title\":\"Open Source Multi Agent System Framework for building ai ...\",\"link\":\"https://github.com/shaunthecomputerscientist/mas-ai\",\"media\":\"\",\"content\":\"Combine such agents in Multi-Agent Systems to achieve more complex goals.\\nMAS AI provides a comprehensive framework for building both standalone agents and complex multi-agent systems.\\nin \\\"model_config.json\\\"\\nThis setup gives your finer control over each component of the agent.\",\"icon\":\"\",\"publish_date\":\"2025-02-25\"},{\"refer\":\"ref_7\",\"title\":\"Multi-Agent System Support by Integrating Agents within Workflows\",\"link\":\"https://github.com/langgenius/dify/issues/13704\",\"media\":\"\",\"content\":\"Requesting a feature for the Dify platform that allows the creation of Multi-Agent systems by integrating Agents within the Workflow structure, enabling\\nThis would enable:\\n- Multi-Agent Systems: Multiple Agents working together within a flow defined by the Workflow to accomplish more complex tasks.\\n- Orchestrator\\nThis allows Agents to trigger a specific workflow and use the results of the Workflow.\",\"icon\":\"\",\"publish_date\":\"2025-02-12\"},{\"refer\":\"ref_8\",\"title\":\"Agent studio: A multi-agent system for systems engineering\",\"link\":\"https://blogs.sw.siemens.com/art-of-the-possible/agent-studio-a-multi-agent-system-for-systems-engineering/\",\"media\":\"\",\"content\":\"A multi-agent system consists of multiple interacting intelligent agents, which can be software, robots, or autonomous entities acting independently within\\nThis setup mirrors the dynamics and expertise that enhance Sarah and her team’s effectiveness.\\nRather than operating as standalone tools, AI agents can experience “team flow” and integrate seamlessly to boost the team’s productivity and workflow.\",\"icon\":\"\",\"publish_date\":\"2024-12-11\"},{\"refer\":\"ref_9\",\"title\":\"This is simple starter application based on Langgraph4j\",\"link\":\"https://github.com/ArnWEB/Langgraph4j-starter\",\"media\":\"\",\"content\":\": Explore LangGraph4j's modular architecture with predefined agents.\\n- Plug-and-Play Setup: Run the project with minimal configuration.\\n- Extensible: Extend\\nUpon running, the application executes a predefined workflow with the following steps:\\n- Logs messages exchanged between agents.\\n- Demonstrates LangGraph4j's\\ntask coordination capabilities.\\n- Add New Agents: Extend the existing framework to include agents with custom logic.\\n- Modify Workflow: Adjust agent interactions\",\"icon\":\"\",\"publish_date\":\"2024-11-22\"},{\"refer\":\"ref_10\",\"title\":\"AgentScope: A Flexible yet Robust Multi-Agent Platform\",\"link\":\"https://arxiv.org/html/2402.14034\",\"media\":\"\",\"content\":\"dynamic workflow; 3)The communication pattern between agents can be varying from one-to-one or broadcasting (e.g., a discussion group of agents).\\nThese resources are designed to reduce the initial setup effort and enable rapid prototyping and deployment of multi-agent LLM systems.\\nFollowing the traditional terms, we name such DAG execution as a workflow and name the nodes in the workflow as workflow nodes .\",\"icon\":\"\",\"publish_date\":\"2024-05-19\"}]"
```

---

## Assistant (Build · claude-opus-4-5 · 8.9s)

**Tool: web-search-prime_webSearchPrime**

**Input:**
```json
{
  "search_query": "opencode-ai agents documentation configuration"
}
```

**Output:**
```
"[{\"refer\":\"ref_1\",\"title\":\"一文搞定opencode：免费claude和gemini加多智能体协作\",\"link\":\"https://m.blog.csdn.net/tirestay/article/details/157844383\",\"media\":\"\",\"content\":\"官方地址： https://github.com/code-yeongyu/oh-my-opencode 。\\n直接拷贝安装命令到 opencode：\\n执行安装：\\n这里会询问是否有 Claude/OpenAI等订阅，按实际情况选择Yes/No，比如这里全选No：\\n安装完成：\\n3.2、小Bug\\n安装完oh-my-opencode进入opencode 时会提示\\\" Agent sisphus's configured model opencode/claude-opus-4-6 is not valid \\\"，切换Agent时也会有类似提示：\\n这应该是默认配置的问题，直接修改配置文件，让agent使用新的可用模型：\\nvi ~/.config/opencode/oh-my-opencode.json\\n一键获取完整项目代码 bash\\n把model配置修正一下：\\n{\\n\\\"$schema\\\": \\\"https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json\\\",\\n\\\"agents\\\": {\\n\\\"hephaestus\\\": {\\n\\\"model\\\": \\\"opencode/kimi-k2.5-free\\\"\\n},\\n\\\"oracle\\\": {\\n\\\"model\\\": \\\"opencode/kimi-k2.5-free\\\"\\n},\\n\\\"librarian\\\": {\\n\\\"model\\\": \\\"opencode/kimi-k2.5-free\\\"\\n},\\n\\\"prometheus\\\": {\\n\\\"model\\\": \\\"opencode/kimi-k2.5-free\\\"\\n},\\n\\\"atlas\\\": {\\n\\\"model\\\": \\\"opencode/kimi-k2.5-free\\\"\\n},\\n... ...\\n},\\n\\\"categories\\\": {\\n\\\"visual-engineering\\\": {\\n\\\"model\\\": \\\"opencode/glm-4.7-free\\\"\\n},\\n\\\"ultrabrain\\\": {\\n\\\"model\\\": \\\"opencode/glm-4.7-free\\\"\\n},\\n... ...\\n}\\n}\\n然后重新进入 opencode 就可以解决问题。\\n3.3、区别\\n/agents的区别\\n默认，左下角是Build，可选的agents有 build 和 plan。\\noh-my-opencode，左下角默认是 sisyphus，可选的agents有 sisyphus、hephaestus、prometheus和atlas。\",\"icon\":\"\",\"publish_date\":\"2026-02-18\"},{\"refer\":\"ref_2\",\"title\":\"【2026最新】Opencode安装配置模型\",\"link\":\"https://m.blog.csdn.net/2401_87660168/article/details/158071820\",\"media\":\"\",\"content\":\"引言\\nOpenCode 是一款 100% 开源的 AI 编码代理（AI Coding Agent），它不仅拥有漂亮的终端用户界面，更核心的是它不与任何特定模型提供商绑定。你可以自由选择各种大模型，甚至本地的开源模型作为其后端 。本文将带你从零开始，手把手在不同操作系统上安装 OpenCode，并完成基础配置，开启你的 AI 编程之旅。\\nopencode官网：https://opencode.ai/zh\\nNodeJS方式安装\\n这里介绍使用nodejs下载，其他方式下载也是差不多的。如果没有下载nodejs最简单的方式就是找一个AI编辑器（如Trae）告诉AI你想要在...目录下安装nodejs，它会自动帮你下载的。\\n输入指令：\\nnpm i -g opencode-ai\\n出现上述错误是因为对于NodeJS文件，当前用户没有修改写入权限，需要找到nodejs文件，右键属性，点击安全，修改如下图的权限。\\n当然如果不想这么麻烦，直接通过管理员权限输入指令即可。\\n安装成功后如下图：\\n输入： opencode\\n显示下方页面就是成功了。\\n输入： /model\\n可以选择你想使用的模型\\n配置模型\\nantigravity+gemini cli oauth插件（用于Opencode）:\\nhttps://github.com/NoeFabris/opencode-antigravity-auth\\n点击下方的命令复制，粘贴在对话里发送即可。\\n然后进入一个新的命令行窗口，\\n输入 opencode auth login\\n选个Google，然后一直回车，中间可能会有一个project，不用管，回车即可，跳转到浏览器进行Google账号的登录。\",\"icon\":\"\",\"publish_date\":\"2026-02-16\"},{\"refer\":\"ref_3\",\"title\":\"Claude Code中英文系列教程33:用魔法打败魔法，利用官方Skill创建Skill\",\"link\":\"https://m.blog.csdn.net/elesos/article/details/158042705\",\"media\":\"\",\"content\":\"地址如下：\\nClaude Code ：~/.claude/skills\\nOpenCode：~/.config/opencode/skill\\n或插件市场方式安装\\n可以在 Claude Code 中运行下面命令将仓库注册为 插件市场，然后再安装skills\\n/plugin marketplace add\\n/ # Specialized agents (optional)\\n ├── skills/ # Agent Skills (optional)\\n ├── hooks/ # Event handlers (optional)\\n ├── .mcp.json # External tool configuration\\n(optional)\\n └── README.md # Plugin documentation\\n ```\\n上面2个仓库中有一个共同的frontend-design，一个通过插件的方式提供，内容差不多\",\"icon\":\"\",\"publish_date\":\"2026-02-13\"},{\"refer\":\"ref_4\",\"title\":\"OpenCode：你的AI编程助手\",\"link\":\"https://www.toutiao.com/a7604455659022582310/\",\"media\":\"\",\"content\":\"AI 辅助编程已成为提升效率的重要手段。OpenCode 作为一款开源的 AI 编程助手，正以其强大的功能和开源特性吸引着越来越多开发者的关注。\\n官方网站：https://opencode.ai/\\n1.安装前准备\\nOpenCode 是一个开源的AI编程助手。\\n3.关于AGENTS.md\\n在 OpenCode 的机制中，AGENTS.md 是 AI 代理在执行任务前必读的“宪法”。\\n上下文注入 ：当你提出需求时，OpenCode 会将 AGENTS.md 的内容作为 System Prompt 的一部分发送给大模型。\\nby the AI must be in **Chinese (Simplified)**. - **Output Policy**: Even if the codebase uses English (e.g., variable names, documentation), the dialogue\",\"icon\":\"\",\"publish_date\":\"2026-02-08\"},{\"refer\":\"ref_5\",\"title\":\"OpenCode：你的AI编程助手\",\"link\":\"https://m.blog.csdn.net/paopao_wu/article/details/157875034\",\"media\":\"\",\"content\":\"AI  辅助编程已成为提升效率的重要手段。 OpenCode  作为一款开源的 AI 编程助手，正以其强大的功能和开源特性吸引着越来越多开发者的关注。\\n官方网站： https://opencode.ai/\\n1.安装前准备\\nOpenCode 是一个开源的AI编程助手。\\n3.关于AGENTS.md\\n在 OpenCode 的机制中， AGENTS.md  是 AI 代理在执行任务前必读的“宪法”。\\n上下文注入 ：当你提出需求时，OpenCode 会将  AGENTS.md  的内容作为 System Prompt 的一部分发送给大模型。\\nby the AI must be in **Chinese (Simplified)**. - **Output Policy**: Even if the codebase uses English (e.g., variable names, documentation), the dialogue\",\"icon\":\"\",\"publish_date\":\"2026-02-08\"},{\"refer\":\"ref_6\",\"title\":\"opencode 安装 -> 使用\",\"link\":\"https://developer.aliyun.com/article/1711158\",\"media\":\"\",\"content\":\"{ \\\"$schema\\\" : \\\"https://opencode.ai/config.json\\\" , \\\"provider\\\" : { \\\"斜线前\\\" : { \\\"options\\\" : { \\\"baseURL\\\" : \\\"模型对应的api\\\" , \\\"apiKey\\\" : \\\"自己的apikey\\\" } , \\\"models\\\" : { \\\"使用的模型1\\\" : { \\\"name\\\" : \\\"使用的模型\\\" , \\\"id\\\" : \\\"使用的模型\\\" } , \\\"使用的模型2\\\" : { \\\"name\\\" : \\\"使用的模型\\\" , \\\"id\\\" : \\\"使用的模型\\\" } , \\\"使用的模型3\\\" : { \\\"name\\\" : \\\"使用的模型\\\" , \\\"id\\\" : \\\"使用的模型\\\" } } } } , \\\"model\\\" : \\\"斜线前/默认使用的模型\\\" }\\n使用\\n# 启动  opencode\\n有两种agent,可以用 tab 切换\\nbuild :默认模式，适合文件操作 plan :适用于指定计划，默认拒绝修改文件\\n其他命令\\n# 切换模型  /models  # 多对话并行 ## 新建会话  /new  ## 选择会话  /sessions   # 导出对话文件  /export  # 对话分享网页  /share  # 结束分享  /unshare\",\"icon\":\"\",\"publish_date\":\"2026-02-06\"},{\"refer\":\"ref_7\",\"title\":\"OpenCode平滑升级指南：从0.1.x到新版本的7个关键步骤\",\"link\":\"https://m.blog.csdn.net/gitblog_00538/article/details/157192946\",\"media\":\"\",\"content\":\"OpenCode平滑升级指南：从0.1.x到新版本的7个关键步骤\\n【免费下载链接】opencode 一个专为终端打造的开源AI编程助手，模型灵活可选，可远程驱动。\\n项目地址: https://gitcode.com/GitHub_Trending/openc/opencode \\n还在为OpenCode版本升级带来的配置丢失和功能异常而烦恼吗？作为一名AI编程助手的深度用户，我深知迁移过程中的痛点。\\n更新快捷键绑定至新的键位映射表\\n第四步：手动配置调整\\n自动迁移后，你需要检查几个关键配置项：\\nAI模型配置 ：确保模型标识符格式正确\\n{   \\\"agents\\\": {     \\\"primary\\\": {       \\\"model\\\": \\\"anthropic/claude-3-sonnet\\\",\",\"icon\":\"\",\"publish_date\":\"2026-01-20\"},{\"refer\":\"ref_8\",\"title\":\"OpenCode与Oh My OpenCode全面使用指南：从入门到精通\",\"link\":\"https://blog.csdn.net/polanpan/article/details/157178146\",\"media\":\"\",\"content\":\"两者关系\\n- OpenCode是基础工具，提供AI编程能力\\n- Oh My OpenCode是增强插件，为OpenCode添加智能体系统和高级功能\\n- 两者结合，使OpenCode从单一AI助手升级为\\\"AI开发团队\\\"\\n二、安装与配置\\n1.\\n/opencode.json\\\"\\n- 全局配置: \\\"~/.config/opencode/opencode.json\\\"\\n- AGENTS.md: 项目根目录，用于描述项目结构和规范\\n- 项目级配置:\\n十、结语\\nOpenCode与Oh My OpenCode的组合代表了AI编程工具的最新发展方向。\\n下一步建议 ：在您的第一个项目中创建\\\"AGENTS.md\\\"文件，详细描述项目架构和规范，这将使AI代理更高效地理解您的项目，显著提升开发效率。\\n“Oh My OpenCode不是在代替开发者，而是让开发者专注于更高级的决策，而让AI处理重复性任务。”\",\"icon\":\"\",\"publish_date\":\"2026-01-19\"},{\"refer\":\"ref_9\",\"title\":\"Open Code教程（四）| 高级配置与集成\",\"link\":\"https://m.blog.csdn.net/qq_20236937/article/details/156984431\",\"media\":\"\",\"content\":\"显存不足？  可以选择量化版本（如 Q4_K_M），显存需求减半。\\n三、AGENTS.md 配置\\nAGENTS.md 是项目级的 AI 配置文件，帮助 OpenCode 更好地理解你的项目。\\n创建方式\\n方式一：自动生成\\n/init\\nAI写代码 bash\\n1\\nOpenCode 会分析项目并生成初始的 AGENTS.md。\\n方式二：手动创建\\n在项目根目录创建  AGENTS.md  文件。\\n推荐结构\\n# 项目名称  ## 项目简介  简要描述项目是做什么的，核心功能有哪些。  ## 技术栈  - 前端：React 18 + TypeScript + Tailwind CSS - 后端：Node.js + Express + PostgreSQL - 工具：Vite、ESLint、Prettier  ## 项目结构  ``` src/ ├── components/    # React 组件 ├── pages/         # 页面组件 ├── hooks/         # 自定义 Hooks ├── services/      # API 服务 ├── stores/        # 状态管理（Zustand） ├── utils/         # 工具函数 └── types/         # TypeScript 类型定义 ```  ## 代码规范  - 组件使用函数式组件 + Hooks - 使用 TypeScript 严格模式 - 变量命名使用 camelCase - 组件命名使用 PascalCase - 文件命名使用 kebab-case - 注释使用中文  ## API 规范  - 基础路径：/api/v1 - 认证方式：Bearer Token - 响应格式：{ code: number, message: string, data: T }  ## 常用命令  ```bash npm run dev      # 启动开发服务器 npm run build    # 构建生产版本 npm run test     # 运行测试 npm run lint     # 代码检查 ```  ## 注意事项  - 敏感配置放在 .env 文件中 - 不要直接修改 node_modules - 提交前运行 lint 和 t...\",\"icon\":\"\",\"publish_date\":\"2026-01-15\"},{\"refer\":\"ref_10\",\"title\":\"GitHub 64k Star 神器！OpenCode 5 分钟上手指南：开源免费，Claude Code 平替！\",\"link\":\"https://m.blog.csdn.net/weixin_40774379/article/details/156881541\",\"media\":\"\",\"content\":\"OpenCode 会扫描项目结构，自动生成  AGENTS.md  文件，类似 Claude Code 的  CLAUDE.md  或 Cursor 的  .cursorrules 。\\n这个文件告诉 AI 你的代码风格、框架选型、目录结构，以后每次对话都会参考它。\\nAI 能看懂图片内容，按照 UI 写页面、根据报错截图定位问题。\\n06｜常用命令\\n输入  /  弹出命令列表。\\n/init ：初始化项目，生成 AGENTS.md，重要且好用！\\n/review ：review 未提交的代码改动。\\n/models ：切换模型。\\n/agents ：切换 Agent。\\n07｜配置文件\\n以上足够用起来了。\\n但如果你想更加自定义，编辑  ~/.config/opencode/opencode.json  就行。\",\"icon\":\"\",\"publish_date\":\"2026-01-12\"}]"
```

**Tool: web-reader_webReader**

**Input:**
```json
{
  "url": "https://github.com/mpazik/openagent"
}
```

**Output:**
```
"{\"title\":\"GitHub - mpazik/openagent: Fork of openagent that adds support for custom agent and tools\",\"description\":\"Fork of openagent that adds support for custom agent and tools - mpazik/openagent\",\"url\":\"https://github.com/mpazik/openagent\",\"content\":\"![Image 1: openagent logo](https://github.com/mpazik/openagent/raw/agent-support/fork-assets/logo-light.svg)\\n\\nOpen source solution for Context and Workflow Engineering.\\n\\nExperimental Fork of opencode\\n\\nopencode is an open sourced terminal-based AI code assistant similar to claude code. This fork allows building specialized agents with:\\n\\n- __Focused prompts__ - No conflicting instructions\\n- __Custom tools__ - Only what they need for their job\\n- __Engineered context__ - Relevant files loaded automatically\\n- __Clear boundaries__ - Agents can't accidentally break things outside their scope\\n\\n_This fork explores agent specialization patterns with the intention of contributing back working solutions to the main opencode project._\\n\\n## Core Principles\\n\\n#### Higher the Scale, Lower the IQ - More Process & Specialization Needed\\n\\nA single AI trying to handle a 100k+ line codebase is like asking one person to be the entire engineering team. The cognitive load is too high - they make mistakes, get confused between contexts, and produce inconsistent results.\\n\\n__The solution?__ Break down the complex tasks into focused specialists that excel at their narrow domain.\\n\\n#### Make Deterministic Logic Deterministic\\n\\nDon't tell agents \\\"how\\\" to run commands - they'll make mistakes. Instead:\\n\\n- Create dedicated tools for common operations (git commits, package installation, test running)\\n- Set permissions at the tool level, not in prompts\\n- Make it impossible for agents to do the wrong thing, rather than telling them not to\\n\\n#### Context Engineering for Engineers\\n\\nDon't ask agents to \\\"open file X and look for Y\\\" repeatedly. Instead:\\n\\n- __Programmatically__ load relevant files and presuppose built artifacts into their context\\n- Replace \\\"if this then that\\\" logic from prompts with prompt variants for different conditions\\n- Do not repeat yourself, have the context always up to date\\n\\n#### Load only what's needed for the job\\n\\nThe more tools the dumber the agent as it gets overloaded with tool's descriptions and definitions. Picking only the right tools for the job allows you to __unleash power of MCP tools__ as having multiple MCP clients does not overwhelm agents.\\n\\nMCP tools are in their infancy age, and they are not as reliable as they should be. Having custom tools __allows building your own integrations__ using plain, reliable HTTP APIs\\n\\n### Getting Started\\n\\n__1. Install__\\n\\n```\\n$ npm install --global openagent-ai\\n# or\\n$ pnpm install --global openagent-ai\\n```\\n\\n__2. Configure Your Project__\\nCreate `openagent.ts` in your project directory:\\n\\n```\\nimport { OpenAgent } from 'openagent-ai';\\nimport { prototypeAgent, implementerAgent, qaAgent } from './agents';\\n\\nexport default {\\n  // your existing opencode configuration  \\n  agents: [prototypeAgent, implementerAgent, qaAgent]\\n}\\n```\\n\\n__3. Run Your First Agent__\\n\\n```\\n# Start interactive session\\n$ openagent agent planner\\n\\n# Get a quick documentation for a TypeScript file\\n$ openagent agent tsdoc --mode run -c {\\\"filePath\\\": \\\"src/your-file-to-document.ts\\\"}\\n```\\n\\n__4. Integrate with Your Workflow__\\nAdd to `package.json` for convenience:\\n\\n```\\n{\\n  \\\"scripts\\\": {\\n    \\\"ai:prototype\\\": \\\"openagent agent prototype\\\",\\n    \\\"ai:implement\\\": \\\"openagent agent implementer\\\",\\n    \\\"ai:qa\\\": \\\"openagent agent qa\\\"\\n  }\\n}\\n```\\n\\n#### Anatomy of the agent\\n\\nAn agent consists of three main parts:\\n\\n1. __Parameter Schema__ - What inputs the agent accepts from CLI/API\\n2. __Context Engineering__ - Load and prepare all relevant information\\n3. __Dynamic Setup__ - Configure tools and prompts based on loaded context\\n\\nThis separation allows you to validate inputs early, load context once, and dynamically configure agents based on the specific task.\\n\\n```\\nexport const exampleAgent = Agent.define(\\n  \\\"agent-id\\\",\\n  \\\"Short description\\\",\\n\\n  // 1. Parameter Schema - Input validation and typing\\n  z.object({\\n    filePath: z.string(),\\n    selection: z.string().optional(),\\n    feature: z.string().optional(),\\n  }).optional(),\\n\\n  // 2. Context Engineering - Load relevant information\\n  async ({ filePath, selection, feature } = {}, services) => {\\n    const readme = await Bun.file(`${import.meta.dir}/../README.md`).text();\\n    const fileStructure = await loadFileStructure(`${import.meta.dir}/..`, {\\n      include: [\\\"**/*.ts\\\", \\\"**/*.json\\\"],\\n      exclude: [\\\"**/*.test.ts\\\", \\\"**/*.mock.ts\\\", \\\"packages/web\\\"],\\n    });\\n\\n    return {\\n      filePath,\\n      feature,\\n      message: `${createSystemMessage(feature)}\\n${envPrompt(services)}\\n<project-description>\\\\n${readme}\\\\n</project-description>\\n<file-structure>\\\\n${fileStructure}\\\\n</file-structure>\\n${await preloadedFilePrompt(services, filePath)} // service allow to mark file as read so agent can immediately update it, if there was no change in the mean time\\n${selectPrompt(selection)}`,\\n    };\\n  },\\n\\n  // 3. Dynamic Setup - Configure tools and prompts\\n  ({ message, feature }) => ({\\n    tools: [\\n      ...BUILD_IN_TOOLS(),\\n      gitCommitTool({ prefix: \\\"bugfix\\\", feature }),\\n      addPackageTool({ include: [\\\"server\\\"] }),\\n      runTestTool(),\\n    ],\\n    message,\\n  }),\\n);\\n```\\n\\n### Workflow with Agents\\n\\n#### Example: Adding User Authentication\\n\\n1. __Planning Phase__\\n\\n   ```\\n   $ openagent agent planner --context '{\\\"filePath\\\": \\\"./specifications/jwt-auth.md\\\"}' \\\"Add user authentication with JWT tokens\\\"\\n   ```\\n\\n   Creates `PLAN.md` with implementation steps, API design, and file structure\\n2. __Architecture Phase__\\n\\n   ```\\n   $ openagent agent architect --context '{\\\"filePath\\\": \\\"./specifications/jwt-auth.md\\\"}' \\\"Review the plan ant create API contracts, interface specifications and database schema\\\"\\n   ```\\n\\n   Defines interfaces, database schema, and API contracts\\n3. __TDD Phase__\\n\\n   ```\\n   $ openagent agent qa --context '{\\\"filePath\\\": \\\"./specifications/jwt-auth.md\\\"}' \\\"Discuss with me test cases that should be implemented for the auth feature\\\"\\n   ```\\n\\n   Creates test suite after discuss it first (all tests initially fail)\\n4. __Implementation Phase__\\n\\n   ```\\n   $ openagent agent implementer --context '{\\\"filePath\\\": \\\"./specifications/jwt-auth.md\\\"}' \\\"Implement auth according to plan, make tests pass\\\"\\n   ```\\n\\n   Writes code to satisfy the tests and requirements\\n\\n#### Parallel Development\\n\\nFor larger features, run specialized agents in parallel:\\n\\n- __Backend implementer__ - Handles API and database logic\\n- __Frontend implementer__ - Focuses on UI components and state management\\n\\n### Agent Examples\\n\\n> __Note:__ All agent prompts are work in progress and subject to change.\\n\\n#### Core Development Workflow\\n\\n- __planner__ - Creates detailed implementation plans with steps and requirements\\n- __architect__ - Designs APIs, interfaces, and system structure\\n- __implementer__ - Writes code according to specs, doesn't modify tests\\n- __qa__ _(upcoming)_ - Writes and runs tests, performs code quality checks\\n- __prototype__ - Builds quick working solutions, ignores linting/tests for speed\\n\\n#### Specialized Development\\n\\n- __tsdoc__ - Generates TypeScript documentation for better code understanding\\n- __toolsmith__ - Helps build custom tools for other agents\\n- __professor__ - Assists in designing and improving agent prompts\\n- __reviewer__ _(upcoming)_ - Analyzes git changes and provides feedback\\n- __coordinator__ _(upcoming)_ - Selects appropriate agents for tasks and orchestrates workflows\\n\\n#### Future: Non-Coding Agents\\n\\n- __researcher__ _(upcoming)_ - Deep research with web search and knowledge base integration\\n- __question__ _(upcoming)_ - General Q&A with web research capabilities\\n- __language-teacher__ _(upcoming)_ - Interactive language learning with level-appropriate conversations\\n\\n### Available Tools\\n\\n> __Note:__ Tools are work in progress and subject to change.\\n\\n#### Core Tools\\n\\n- __save__ - Save to a specific file given in the configuration, prevents agents from writing to unauthorized files\\n- __refresh__ - Refreshes the file given in the configuration, useful if the file was modified by someone else since last agent read\\n- __git-commit__ - Git commits with proper prefixes, feature names, and staging\\n- __git-status__ - Shows git status for agent awareness\\n- __add-package__ - Handles package installation in monorepo setups\\n- __run-test__ _(upcoming)_ - Runs tests for specific files or directories\\n- __history__ _(upcoming)_ - Shows git history for agent context _(upcoming)_\\n- __commit-read__ _(upcoming)_ - Reads recent commits for context _(upcoming)_\\n\\n#### Future Vision\\n\\nIn a ideal world we would have an ecosystem of reusable and composable tools and agents distributed as separate packages, so that you can easily install them and use in your projects.\\n\\nThe idea is to have:\\n\\n- Community-contributed specialized agents\\n- Industry-specific tool packages\\n- Standardized agent interfaces\\n- Composable AI development workflows\\n\\n### Tips\\n\\n#### Integrate with your IDE\\n\\nYou can use openagent with your IDE, you can make launch script for VSCode or webstorm, to run agents and tools directly from the editor.\\n\\nUse (run-agent.ts) - you can define mapping for the agent to pick for a given path\\n\\nWebstorm config\\n\\n```\\nFile: agents/scripts/run-agent.ts\\nApplication argbument: $FilePath$ $SelectedText$ $Prompt$\\n```\\n\\n#### Git worktree\\n\\nMake multiple direcotries for your agent to run in parallel, sharing the same git repository.\\n\\n```\\n$ git worktree add -b <branch> <directory>\\n```\\n\\nRecommended plugin Git Workree For JetBrains IDEs.\\n\\n### Documentation\\n\\nFor more info on how to configure opencode __head over to opencode docs__.\\n\\n### Contributing\\n\\nThis project is __not__ meant to be a long term fork of opencode, but rather a working proof of concept.\\n\\nContripution to agents and examples have very well come.\\nIf you would like the core part of the application please head to the opencode repository.\\n\\nThanks to the authors of opencode for creating and maintaining this amazing initiative and making the code base easy to work with.\",\"metadata\":{\"og:image\":\"https://opengraph.githubassets.com/e47ec5949f04b2cf8444c97004c19996610a04457cd0cd500be90c2b7cadadd0/mpazik/openagent\",\"og:image:width\":\"1200\",\"twitter:card\":\"summary_large_image\",\"og:site_name\":\"GitHub\",\"release\":\"3d444f0a47beeeac94cddbb51c91ab408befe8d4\",\"html-safe-nonce\":\"8d2e71fe255a5c09970917e81e1aa22c943feb8cf3ae9a37a778195b61a1cb1b\",\"expected-hostname\":\"github.com\",\"og:description\":\"Fork of openagent that adds support for custom agent and tools - mpazik/openagent\",\"browser-errors-url\":\"https://api.github.com/_private/browser/errors\",\"octolytics-dimension-user_login\":\"mpazik\",\"hostname\":\"github.com\",\"browser-stats-url\":\"https://api.github.com/_private/browser/stats\",\"route-pattern\":\"/:user_id/:repository\",\"octolytics-dimension-repository_id\":\"1015497378\",\"octolytics-dimension-repository_network_root_nwo\":\"anomalyco/opencode\",\"og:image:alt\":\"Fork of openagent that adds support for custom agent and tools - mpazik/openagent\",\"google-site-verification\":\"Apib7-x98H0j5cPqHWwSMm6dNU4GmODRoqxLiDzdx9I\",\"visitor-hmac\":\"795b0ad9d7a1c65698587aab17678141686eb987be5ae635adc29ab13438bca9\",\"turbo-cache-control\":\"no-preview\",\"request-id\":\"2DEB:208573:3A9156E:4304253:698C9AB4\",\"octolytics-dimension-repository_is_fork\":\"true\",\"go-import\":\"github.com/mpazik/openagent git https://github.com/mpazik/openagent.git\",\"octolytics-dimension-user_id\":\"4086126\",\"octolytics-dimension-repository_network_root_id\":\"975734319\",\"route-controller\":\"files\",\"octolytics-url\":\"https://collector.github.com/github/collect\",\"apple-itunes-app\":\"app-id=1477376905, app-argument=https://github.com/mpazik/openagent\",\"theme-color\":\"#1e2327\",\"octolytics-dimension-repository_parent_nwo\":\"anomalyco/opencode\",\"hovercard-subject-tag\":\"repository:1015497378\",\"turbo-body-classes\":\"logged-out env-production page-responsive\",\"description\":\"Fork of openagent that adds support for custom agent and tools - mpazik/openagent\",\"twitter:image\":\"https://opengraph.githubassets.com/e47ec5949f04b2cf8444c97004c19996610a04457cd0cd500be90c2b7cadadd0/mpazik/openagent\",\"twitter:site\":\"@github\",\"octolytics-dimension-repository_parent_id\":\"975734319\",\"visitor-payload\":\"eyJyZWZlcnJlciI6IiIsInJlcXVlc3RfaWQiOiIyREVCOjIwODU3MzozQTkxNTZFOjQzMDQyNTM6Njk4QzlBQjQiLCJ2aXNpdG9yX2lkIjoiNDgyODY2MDc4MDA4MDMzOTYzNyIsInJlZ2lvbl9lZGdlIjoiY2VudHJhbGluZGlhIiwicmVnaW9uX3JlbmRlciI6ImNlbnRyYWxpbmRpYSJ9\",\"github-keyboard-shortcuts\":\"repository,copilot\",\"lang\":\"en\",\"fetch-nonce\":\"v2:0d36f453-abe3-e9ed-380a-e7a580b2424b\",\"og:type\":\"object\",\"twitter:title\":\"GitHub - mpazik/openagent: Fork of openagent that adds support for custom agent and tools\",\"og:title\":\"GitHub - mpazik/openagent: Fork of openagent that adds support for custom agent and tools\",\"og:image:height\":\"600\",\"analytics-location\":\"/<user-name>/<repo-name>\",\"color-scheme\":\"light dark\",\"route-action\":\"disambiguate\",\"octolytics-dimension-repository_public\":\"true\",\"fb:app_id\":\"1401488693436528\",\"ui-target\":\"full\",\"octolytics-dimension-repository_nwo\":\"mpazik/openagent\",\"viewport\":\"width=device-width\",\"twitter:description\":\"Fork of openagent that adds support for custom agent and tools - mpazik/openagent\",\"current-catalog-service-hash\":\"f3abb0cc802f3d7b95fc8762b94bdcb13bf39634c40c357301c4aa1d67a256fb\",\"disable-turbo\":\"false\",\"og:url\":\"https://github.com/mpazik/openagent\"},\"external\":{\"stylesheet\":{\"https://github.githubassets.com/assets/light-7a548c73f231168f.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/primer-primitives-2c5f58bae956fa96.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/primer-react.7bdab33cf4d9c38d.module.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/keyboard-shortcuts-dialog.124a139fc586638e.module.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/primer-b97936554294d7a3.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/global-5d300701a37a830a.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/dark-a037c5198a3956d3.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/dark_high_contrast-c4cd957551b6a79f.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/light_high_contrast-6d5205ba83e64657.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/repository-c2a686ef3f37f3e5.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/code-67953c77b47fec3b.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/github-294399c8d5b652c5.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/94077.2a3ef11f8e0edae3.module.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/notifications-subscriptions-menu.72e14da340cf5788.module.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/marketing-navigation.6981f452ada322e1.module.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/appearance-settings.51d12175097b565e.module.css\":{\"media\":\"all\"}},\"preconnect\":{\"https://github.githubassets.com\":{},\"https://avatars.githubusercontent.com\":{}},\"search\":{\"/opensearch.xml\":{\"title\":\"GitHub\",\"type\":\"application/opensearchdescription+xml\"}},\"assets\":{\"https://github.githubassets.com/\":{}},\"dns-prefetch\":{\"https://user-images.githubusercontent.com/\":{},\"https://github-cloud.s3.amazonaws.com\":{},\"https://github.githubassets.com\":{},\"https://avatars.githubusercontent.com\":{}},\"fluid-icon\":{\"https://github.com/fluidicon.png\":{\"title\":\"GitHub\"}},\"manifest\":{\"/manifest.json\":{}},\"icon\":{\"https://github.githubassets.com/favicons/favicon.svg\":{\"type\":\"image/svg+xml\"}},\"alternate\":{\"https://github.githubassets.com/favicons/favicon.png\":{\"type\":\"image/png\"}},\"mask-icon\":{\"https://github.githubassets.com/assets/pinned-octocat-093da3e6fa40.svg\":{}},\"canonical\":{\"https://github.com/mpazik/openagent\":{}}}}"
```

---

## Assistant (Build · claude-opus-4-5 · 7.8s)

This is very helpful! Now let me look for the official opencode documentation and see how agents are configured:

**Tool: web-reader_webReader**

**Input:**
```json
{
  "url": "https://opencode.ai/docs"
}
```

**Output:**
```
"{\"title\":\"Intro\",\"description\":\"Get started with OpenCode.\",\"url\":\"https://opencode.ai/docs\",\"content\":\"Get started with OpenCode.\\n\\n__OpenCode__ is an open source AI coding agent. It’s available as a terminal-based interface, desktop app, or IDE extension.\\n\\n![Image 1: OpenCode TUI with the opencode theme](https://opencode.ai/docs/_astro/screenshot.CQjBbRyJ_1dLadc.webp)\\n\\nLet’s get started.\\n\\n---\\n\\n#### Prerequisites\\n\\nTo use OpenCode in your terminal, you’ll need:\\n\\n1. A modern terminal emulator like:\\n\\n   - WezTerm, cross-platform\\n   - Alacritty, cross-platform\\n   - Ghostty, Linux and macOS\\n   - Kitty, Linux and macOS\\n2. API keys for the LLM providers you want to use.\\n\\n---\\n\\n## Install\\n\\nThe easiest way to install OpenCode is through the install script.\\n\\n```\\ncurl -fsSL https://opencode.ai/install | bash\\n```\\n\\nYou can also install it with the following commands:\\n\\n- __Using Node.js__\\n\\n  - npm\\n  - Bun\\n  - pnpm\\n  - Yarn\\n\\n  ```\\n  npm install -g opencode-ai\\n  ```\\n- __Using Homebrew on macOS and Linux__\\n\\n  ```\\n  brew install anomalyco/tap/opencode\\n  ```\\n\\n  > We recommend using the OpenCode tap for the most up to date releases. The official `brew install opencode` formula is maintained by the Homebrew team and is updated less frequently.\\n- __Installing on Arch Linux__\\n\\n  ```\\n  sudo pacman -S opencode           # Arch Linux (Stable)\\n\\n  paru -S opencode-bin              # Arch Linux (Latest from AUR)\\n  ```\\n\\n#### Windows\\n\\n- __Using Chocolatey__\\n- __Using Scoop__\\n- __Using NPM__\\n\\n  ```\\n  npm install -g opencode-ai\\n  ```\\n- __Using Mise__\\n\\n  ```\\n  mise use -g github:anomalyco/opencode\\n  ```\\n- __Using Docker__\\n\\n  ```\\n  docker run -it --rm ghcr.io/anomalyco/opencode\\n  ```\\n\\nSupport for installing OpenCode on Windows using Bun is currently in progress.\\n\\nYou can also grab the binary from the Releases.\\n\\n---\\n\\n## Configure\\n\\nWith OpenCode you can use any LLM provider by configuring their API keys.\\n\\nIf you are new to using LLM providers, we recommend using OpenCode Zen.\\nIt’s a curated list of models that have been tested and verified by the OpenCode\\nteam.\\n\\n1. Run the `/connect` command in the TUI, select opencode, and head to opencode.ai/auth.\\n2. Sign in, add your billing details, and copy your API key.\\n3. Paste your API key.\\n\\nAlternatively, you can select one of the other providers. Learn more.\\n\\n---\\n\\n## Initialize\\n\\nNow that you’ve configured a provider, you can navigate to a project that\\nyou want to work on.\\n\\nAnd run OpenCode.\\n\\nNext, initialize OpenCode for the project by running the following command.\\n\\nThis will get OpenCode to analyze your project and create an `AGENTS.md` file in\\nthe project root.\\n\\nThis helps OpenCode understand the project structure and the coding patterns\\nused.\\n\\n---\\n\\n## Usage\\n\\nYou are now ready to use OpenCode to work on your project. Feel free to ask it\\nanything!\\n\\nIf you are new to using an AI coding agent, here are some examples that might\\nhelp.\\n\\n---\\n\\n### Ask questions\\n\\nYou can ask OpenCode to explain the codebase to you.\\n\\n```\\nHow is authentication handled in @packages/functions/src/api/index.ts\\n```\\n\\nThis is helpful if there’s a part of the codebase that you didn’t work on.\\n\\n---\\n\\n### Add features\\n\\nYou can ask OpenCode to add new features to your project. Though we first recommend asking it to create a plan.\\n\\n1. __Create a plan__\\n\\n   OpenCode has a _Plan mode_ that disables its ability to make changes and\\n   instead suggest _how_ it’ll implement the feature.\\n\\n   Switch to it using the __Tab__ key. You’ll see an indicator for this in the lower right corner.\\n\\n   Now let’s describe what we want it to do.\\n\\n   ```\\n   When a user deletes a note, we'd like to flag it as deleted in the database.\\n\\n   Then create a screen that shows all the recently deleted notes.\\n\\n   From this screen, the user can undelete a note or permanently delete it.\\n   ```\\n\\n   You want to give OpenCode enough details to understand what you want. It helps\\n   to talk to it like you are talking to a junior developer on your team.\\n2. __Iterate on the plan__\\n\\n   Once it gives you a plan, you can give it feedback or add more details.\\n\\n   ```\\n   We'd like to design this new screen using a design I've used before.\\n\\n   [Image #1] Take a look at this image and use it as a reference.\\n   ```\\n\\n   OpenCode can scan any images you give it and add them to the prompt. You can\\n   do this by dragging and dropping an image into the terminal.\\n3. __Build the feature__\\n\\n   Once you feel comfortable with the plan, switch back to _Build mode_ by\\n   hitting the __Tab__ key again.\\n\\n   And asking it to make the changes.\\n\\n   ```\\n   Sounds good! Go ahead and make the changes.\\n   ```\\n\\n---\\n\\n### Make changes\\n\\nFor more straightforward changes, you can ask OpenCode to directly build it\\nwithout having to review the plan first.\\n\\n```\\nWe need to add authentication to the /settings route. Take a look at how this is\\n\\nhandled in the /notes route in @packages/functions/src/notes.ts and implement\\n\\nthe same logic in @packages/functions/src/settings.ts\\n```\\n\\nYou want to make sure you provide a good amount of detail so OpenCode makes the right\\nchanges.\\n\\n---\\n\\n### Undo changes\\n\\nLet’s say you ask OpenCode to make some changes.\\n\\n```\\nCan you refactor the function in @packages/functions/src/api/index.ts?\\n```\\n\\nBut you realize that it is not what you wanted. You __can undo__ the changes\\nusing the `/undo` command.\\n\\nOpenCode will now revert the changes you made and show your original message\\nagain.\\n\\n```\\nCan you refactor the function in @packages/functions/src/api/index.ts?\\n```\\n\\nFrom here you can tweak the prompt and ask OpenCode to try again.\\n\\nOr you __can redo__ the changes using the `/redo` command.\\n\\n---\\n\\nThe conversations that you have with OpenCode can be shared with your\\nteam.\\n\\nThis will create a link to the current conversation and copy it to your clipboard.\\n\\nHere’s an example conversation with OpenCode.\\n\\n---\\n\\n## Customize\\n\\nAnd that’s it! You are now a pro at using OpenCode.\\n\\nTo make it your own, we recommend picking a theme, customizing the keybinds, configuring code formatters, creating custom commands, or playing around with the OpenCode config.\",\"publishedTime\":\"2026-02-21T00:38:29.000Z\",\"metadata\":{\"og:image\":\"https://social-cards.sst.dev/opencode-docs/SW50cm8%3D.png?desc=Get%20started%20with%20OpenCode.\",\"og:type\":\"article\",\"twitter:card\":\"summary_large_image\",\"og:site_name\":\"OpenCode\",\"og:title\":\"Intro\",\"description\":\"Get started with OpenCode.\",\"generator\":[\"Astro v5.7.13\",\"Starlight v0.34.3\"],\"og:description\":\"Get started with OpenCode.\",\"twitter:image\":\"https://social-cards.sst.dev/opencode-docs/SW50cm8%3D.png?desc=Get%20started%20with%20OpenCode.\",\"viewport\":\"width=device-width, initial-scale=1\",\"og:locale\":\"en\",\"lang\":\"en\",\"og:url\":\"https://opencode.ai/docs/\"},\"external\":{\"stylesheet\":{\"/docs/_astro/ec.4c0k7.css\":{},\"/docs/_astro/_id_.Eybx6q7B.css\":{},\"/docs/_astro/print.DNXP8c50.css\":{\"media\":\"print\"}},\"shortcut\":{\"/docs/favicon-v3.svg\":{\"type\":\"image/svg+xml\"}},\"icon\":{\"/favicon-v3.ico\":{\"sizes\":\"32x32\"},\"/favicon-96x96-v3.png\":{\"sizes\":\"96x96\",\"type\":\"image/png\"}},\"alternate\":{\"https://opencode.ai/docs/pl/\":{},\"https://opencode.ai/docs/tr/\":{},\"https://opencode.ai/docs/da/\":{},\"https://opencode.ai/docs/de/\":{},\"https://opencode.ai/docs/ko/\":{},\"https://opencode.ai/docs/ru/\":{},\"https://opencode.ai/docs/zh-cn/\":{},\"https://opencode.ai/docs/fr/\":{},\"https://opencode.ai/docs/it/\":{},\"https://opencode.ai/docs/es/\":{},\"https://opencode.ai/docs/ar/\":{},\"https://opencode.ai/docs/bs/\":{},\"https://opencode.ai/docs/\":{},\"https://opencode.ai/docs/nb/\":{},\"https://opencode.ai/docs/th/\":{},\"https://opencode.ai/docs/zh-tw/\":{},\"https://opencode.ai/docs/pt-br/\":{},\"https://opencode.ai/docs/ja/\":{}},\"canonical\":{\"https://opencode.ai/docs/\":{}},\"modulepreload\":{\"/docs/_astro/preload-helper.DlqPsdi1.js\":{},\"/docs/_astro/ui-core.cwfCQaAl.js\":{}},\"sitemap\":{\"/docs/sitemap-index.xml\":{}},\"apple-touch-icon\":{\"/apple-touch-icon-v3.png\":{\"sizes\":\"180x180\"}}}}"
```

**Tool: web-search-prime_webSearchPrime**

**Input:**
```json
{
  "search_query": "oh-my-opencode agents configuration multi-agent workflow"
}
```

**Output:**
```
"[{\"refer\":\"ref_1\",\"title\":\"一文搞定opencode：免费claude和gemini加多智能体协作\",\"link\":\"https://m.blog.csdn.net/tirestay/article/details/157844383\",\"media\":\"\",\"content\":\"官方地址： https://github.com/code-yeongyu/oh-my-opencode 。\\n直接拷贝安装命令到 opencode：\\n执行安装：\\n这里会询问是否有 Claude/OpenAI等订阅，按实际情况选择Yes/No，比如这里全选No：\\n安装完成：\\n3.2、小Bug\\n安装完oh-my-opencode进入opencode 时会提示\\\" Agent sisphus's configured model opencode/claude-opus-4-6 is not valid \\\"，切换Agent时也会有类似提示：\\n这应该是默认配置的问题，直接修改配置文件，让agent使用新的可用模型：\\nvi ~/.config/opencode/oh-my-opencode.json\\n一键获取完整项目代码 bash\\n把model配置修正一下：\\n{\\n\\\"$schema\\\": \\\"https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json\\\",\\n\\\"agents\\\": {\\n\\\"hephaestus\\\": {\\n\\\"model\\\": \\\"opencode/kimi-k2.5-free\\\"\\n},\\n\\\"oracle\\\": {\\n\\\"model\\\": \\\"opencode/kimi-k2.5-free\\\"\\n},\\n\\\"librarian\\\": {\\n\\\"model\\\": \\\"opencode/kimi-k2.5-free\\\"\\n},\\n\\\"prometheus\\\": {\\n\\\"model\\\": \\\"opencode/kimi-k2.5-free\\\"\\n},\\n\\\"atlas\\\": {\\n\\\"model\\\": \\\"opencode/kimi-k2.5-free\\\"\\n},\\n... ...\\n},\\n\\\"categories\\\": {\\n\\\"visual-engineering\\\": {\\n\\\"model\\\": \\\"opencode/glm-4.7-free\\\"\\n},\\n\\\"ultrabrain\\\": {\\n\\\"model\\\": \\\"opencode/glm-4.7-free\\\"\\n},\\n... ...\\n}\\n}\\n然后重新进入 opencode 就可以解决问题。\\n3.3、区别\\n/agents的区别\\n默认，左下角是Build，可选的agents有 build 和 plan。\\noh-my-opencode，左下角默认是 sisyphus，可选的agents有 sisyphus、hephaestus、prometheus和atlas。\",\"icon\":\"\",\"publish_date\":\"2026-02-18\"},{\"refer\":\"ref_2\",\"title\":\"windows 中使用 OpenCode + oh-my-opencode +GLM\",\"link\":\"https://m.blog.csdn.net/hopsky/article/details/156983706\",\"media\":\"\",\"content\":\"OpenCode 是一个在终端里运行的 AI 编程助手，而 oh-my-opencode 是它的“超级插件”，通过引入多智能体（Multi-Agent）架构，让 AI 能够像一个完整的开发团队一样协作，从而更好地处理复杂任务。\\n# opencode 安装参考 https: / / opencode.ai /\\nnpm i -g opencode-ai\\n# oh my opencode: 安装参考 https: / / ohmyopencode.com / installation /\\nnpm install -g oh-my-opencode\\n总结建议\\nOpenCode + oh-my-opencode 的组合非常适合 重度终端用户 、 远程开发 场景以及对 数据隐私 有要求的开发者。\\n我的建议是 ：先在一个非核心的测试项目中运行  /init ，生成  AGENTS.md  并阅读一下 AI 对项目的理解是否准确。\",\"icon\":\"\",\"publish_date\":\"2026-01-23\"},{\"refer\":\"ref_3\",\"title\":\"windows 中使用 OpenCode + oh-my-opencode +GLM\",\"link\":\"https://blog.csdn.net/hopsky/article/details/156983706\",\"media\":\"\",\"content\":\"OpenCode  是一个在终端里运行的 AI 编程助手，而 oh-my-opencode 是它的“超级插件”，通过引入多智能体（Multi-Agent）架构，让 AI 能够像一个完整的开发团队一样协作，从而更好地处理复杂任务。\\n# opencode 安装参考 https: / / opencode.ai /\\nnpm i -g opencode-ai\\n# oh my opencode: 安装参考 https: / / ohmyopencode.com / installation /\\nnpm install -g oh-my-opencode\\n总结建议\\nOpenCode + oh-my-opencode 的组合非常适合 重度终端用户 、 远程开发 场景以及对 数据隐私 有要求的开发者。\\n我的建议是 ：先在一个非核心的测试项目中运行  /init ，生成  AGENTS.md  并阅读一下 AI 对项目的理解是否准确。\",\"icon\":\"\",\"publish_date\":\"2026-01-23\"},{\"refer\":\"ref_4\",\"title\":\"alvinunreal/oh-my-opencode-slim\",\"link\":\"https://github.com/alvinunreal/oh-my-opencode-slim\",\"media\":\"\",\"content\":\"A lightweight, powerful agent orchestration plugin for OpenCode\\n\\\"The Pantheon - Agent Team\\\" ()\\nTransform your AI assistant into a manager capable of delegating complex tasks to specialized sub-agents, running searches in the background, and managing multi-step workflows with ease.\\nSlimmed-down fork of oh-my-opencode - focused on core agent orchestration without the extra bells and whistles.\\nAntigravity subscription recommended.The pantheon is tuned for Antigravity's model routing. Other providers work, but you'll get the best experience with Antigravity.\\n- Installation\\n- ️ Architecture & Flow\\n- ️ Meet the Pantheon\\n- ️ Tools & Capabilities\\n- Skills\\n- MCP Servers\\n- ⚙️ Configuration\\n- ️ Uninstallation\\nRun the interactive installer:\\n\\\"bunx oh-my-opencode-slim install\\\"Or use non-interactive mode:\\n\\\"bunx oh-my-opencode-slim install --no-tui --antigravity=yes --openai=yes --cerebras=no\\\"Alternative: Ask any coding agent\\nPaste this into Claude Code, AmpCode, Cursor, or any coding agent:\\nInstall and configure by following the instructions here: Instructions for LLM Agents (click to expand)\\nIf you're an LLM Agent helping set up oh-my-opencode-slim, follow these steps.\\n\\\"opencode --version\\\"If not installed, direct the user to first.\\nAsk these questions one at a time , waiting for responses:\\n- \\\"Do you have an Antigravity subscription?\\\"(Provides Claude + Gemini via \\\"google/\\\"prefix)\\n- \\\"Do you have access to OpenAI API?\\\"(Enables \\\"openai/\\\"models)\\n- \\\"Do you have access to Cerebras API?\\\"(Enables \\\"cerebras/\\\"for fast exploration)\\nBased on answers, run:\\n\\\"bunx oh-my-opencode-slim install --no-tui --antigravity=<yes|no> --openai=<yes|no> --cerebras=<yes|no>\\\"Examples:\\n# Antigravity + OpenAI\\nbunx oh-my-opencode-slim install --no-tui --antigravity=yes --openai=yes --cerebras=no\\n# OpenAI only\\nbunx oh-my-opencode-slim install --no-tui --antigravity=no --openai=yes --cerebras=no\\n# All providers\\nbunx oh-my-opencode-slim install --no-tui --antigravity=yes --openai=yes --cerebras=yes\\nThe installer automatically:\",\"icon\":\"\",\"publish_date\":\"2026-01-23\"},{\"refer\":\"ref_5\",\"title\":\"OpenCode与Oh My OpenCode全面使用指南：从入门到精通\",\"link\":\"https://blog.csdn.net/polanpan/article/details/157178146\",\"media\":\"\",\"content\":\"Oh My OpenCode\\nOh My OpenCode是OpenCode的增强插件，类似于zsh的oh-my-zsh，它为OpenCode提供了更强大的多智能体协作（Multi-Agent）能力和优化的工作流。正如官方介绍：“The Best Agent Harness.\\n/opencode.json\\\"\\n- 全局配置: \\\"~/.config/opencode/opencode.json\\\"\\n- AGENTS.md: 项目根目录，用于描述项目结构和规范\\n- 项目级配置:\\n十、结语\\nOpenCode与Oh My OpenCode的组合代表了AI编程工具的最新发展方向。\\n下一步建议 ：在您的第一个项目中创建\\\"AGENTS.md\\\"文件，详细描述项目架构和规范，这将使AI代理更高效地理解您的项目，显著提升开发效率。\\n“Oh My OpenCode不是在代替开发者，而是让开发者专注于更高级的决策，而让AI处理重复性任务。”\",\"icon\":\"\",\"publish_date\":\"2026-01-19\"},{\"refer\":\"ref_6\",\"title\":\"OpenCode深度定制：打造专属AI Agent系统\",\"link\":\"https://post.smzdm.com/p/a3rvg00n\",\"media\":\"\",\"content\":\"OpenCode与oh-my-opencode组合提供深度定制AI操作系统的能力，支持用户自定义多Agent流水线，比Claude Code更灵活。这套工具允许从模型选择到Agent创建的全流程调整，显著提升生产力，尤其适合内容创作等复杂场景。\\n智能速览\\nOpenCode和oh-my-opencode支持丰富配置，可重构多Agent流水线。\\n用户级配置优先级低于项目级配置，满足多场景需求。\\n通过fork项目可硬编码修改Agent，如NewType Profile定制8个内容创作Agent。\\n多Agent并行工作提升效率，如自动切换探讨与执行模式。\\n验证案例显示多Agent协作能高效处理信息，如 英伟达 故障率分析。\\n精华内容\\n多Agent编排是今年AI领域最大趋势，而OpenCode通过高度可定制化，让Agent适配个人工作方式，成为生产力跃升的关键。\\n配置层级\\nOpenCode配置分用户级和项目级，用户级位于~/.config/opencode文件夹，项目级在项目根目录的.opencode文件夹。项目级配置优先级更高，可覆盖用户级设置。两个层级均包含opencode.json（本体配置）和oh-my-opencode.json（插件配置），支持模型选择、Agent参数等调整。例如，用户级可默认启用插件，项目级可单独指定Agent调用模型，实现灵活适配不同任务需求。\\nAgent定制\",\"icon\":\"\",\"publish_date\":\"2026-01-14\"},{\"refer\":\"ref_7\",\"title\":\"@reinamaccredy/oh-my-opencode - NPM\",\"link\":\"https://www.npmjs.com/package/@reinamaccredy/oh-my-opencode?activeTab=dependents\",\"media\":\"\",\"content\":\"setup.\\n= \\\"oh-my-opencode\\\")]' \\\\ ~/.config/opencode/opencode.json > /tmp/oc.json && \\\\ mv /tmp/oc.json ~/.config/opencode/opencode.json\\n- Remove configuration files\\nAsk @explore for the policy on this feature\\nCustomize agent models, prompts, and permissions in \\\"oh-my-opencode.json\\\". See Configuration.\",\"icon\":\"\",\"publish_date\":\"2026-01-09\"},{\"refer\":\"ref_8\",\"title\":\"开源宝藏组合：OpenCode + oh-my-opencode\",\"link\":\"https://www.toutiao.com/a7592151541767782962/\",\"media\":\"\",\"content\":\"OpenCode 是一个开源的终端 AI 编程助手（类似于 Claude Code，但开源且支持多模型），\\n而 oh-my-opencode 是一个社区驱动的增强插件/配置包，旨在为 OpenCode 提供更强大的多智能体协作（Multi-Agent）能力和更优化的工作流。\\n第二步：安装 oh-my-opencode (增强插件)\\n oh-my-opencode 就像是 Zsh 的 oh-my-zsh，它通过预设的配置和智能体编排层来增强 OpenCode 的能力。它主要引入了一个“编排者”智能体（Orchestrator），可以更好地拆分任务。\\n配置文件\\nhttp://AGENTS.md：这是项目的“说明书”。建议在项目根目录维护这个文件，告诉 AI 项目的架构、代码风格等。\\nopencode.json：位于 \\n~/.config/opencode/opencode.json。\",\"icon\":\"\",\"publish_date\":\"2026-01-06\"},{\"refer\":\"ref_9\",\"title\":\"Claude-Code-Multi-Agent开源，强大的claude code Subagent工作流\",\"link\":\"https://m.toutiao.com/a7535390503094534694/\",\"media\":\"\",\"content\":\"多代理并行协作时的上下文传递 大型代码库的分析和重构 复杂架构设计的迭代优化 全面的测试套件生成和验证\\n建议在使用前：\\n设置合理的token使用限制 优先处理关键功能模块 合理根据自身需求使用不同复杂度的工作流\\n推荐MCP协同配置以达最佳效果\\n为了充分发挥 Claude-Code-Multi-Agent 系统的全部潜力，我们强烈建议配置  模型上下文协议 。通过启用一系列协同工作的MCP服务器，您可以为AI代理提供与外部世界交互、长期记忆、浏览器自动化等高级能力，从而实现更复杂、更可靠的自动化开发工作流。\\n配置方法\\n请将以下 mcpServers 配置代码块添加到您的\\n.claude/settings.local.json 文件中。如果文件不存在，请创建一个。\",\"icon\":\"\",\"publish_date\":\"2025-08-06\"},{\"refer\":\"ref_10\",\"title\":\"OpenCode + oh-my-opencode，这才是编程AI Agent该有的样子\",\"link\":\"http://xmsumi.com/detail/2236\",\"media\":\"\",\"content\":\"降低“理解偏差”导致的反复修改 显性化“需求评审 + 设计讨论”步骤，便于审计与回溯 将“能不能改”与“怎么改”拆分，匹配团队的变更门禁策略\\n多 Agent + 多会话\\n针对同一项目可并行创建多个会话，不同 Agent 专责不同任务；通过  @general  等通用 Agent 处理跨文件分析或复杂搜索。\\n价值在于贴近真实工程中的角色分工（如“测试设计”“重构”“依赖升级”）并可并行推进。\\nMCP + Skills 扩展\\nMCP（Model Context Protocol）用于安全、可控地接入外部系统（如 Sentry、GitHub、内部知识库/工单系统）；\\nSkills 将可复用的工程经验沉淀为“能力模板”（如发布流程、CR 规范、CI 检查），让团队把“方法论”落成可执行资产。\\n四、安装与快速上手\\n安装方式\\n# 一键安装（官方脚本） curl -fsSL https://opencode.ai/install | bash  # macOS / Linux brew install opencode  # Windows choco install opencode scoop install extras/opencode  # Node npm install -g opencode-ai  # Docker docker run -it --rm ghcr.io/anomalyco/opencode\\n桌面版（Beta）与 IDE 插件可在  opencode.ai/download  获取。\\n启动与初始化\\ncd your-project opencode /init           # 生成 AGENTS.md（项目“入职手册”）\\n/connect        # 选择模型 Provider 并填入 API ...\",\"icon\":\"\",\"publish_date\":\"2025-08-04\"}]"
```

---

## Assistant (Build · claude-opus-4-5 · 16.3s)

**Tool: web-reader_webReader**

**Input:**
```json
{
  "url": "https://opencode.ai/docs/reference/agents"
}
```

**Output:**
```
MCP error -400: {"error":{"code":"1214","message":"The requested resource was not found"}}
```

**Tool: web-reader_webReader**

**Input:**
```json
{
  "url": "https://github.com/code-yeongyu/oh-my-opencode"
}
```

**Output:**
```
"{\"title\":\"GitHub - code-yeongyu/oh-my-opencode: the best agent harness\",\"description\":\"the best agent harness. Contribute to code-yeongyu/oh-my-opencode development by creating an account on GitHub.\",\"url\":\"https://github.com/code-yeongyu/oh-my-opencode\",\"content\":\"Warning\\n\\n__Security warning: impersonation site__\\n\\n__ohmyopencode.com is NOT affiliated with this project.__ We do not operate or endorse that site.\\n\\nOhMyOpenCode is __free and open-source__. Do __not__ download installers or enter payment details on third-party sites that claim to be \\\"official.\\\"\\n\\nBecause the impersonation site is behind a paywall, we __cannot verify what it distributes__. Treat any downloads from it as __potentially unsafe__.\\n\\n✅ Official downloads: https://github.com/code-yeongyu/oh-my-opencode/releases\\n\\nNote\\n\\n![Image 1: Sisyphus Labs - Sisyphus is the agent that codes like your team.](https://github.com/code-yeongyu/oh-my-opencode/raw/dev/.github/assets/sisyphuslabs.png?v=2)\\n\\n> __We're building a fully productized version of Sisyphus to define the future of frontier agents.   \\n> Join the waitlist here.__\\n\\nTip\\n\\nBe with us!\\n\\n| Image 2: Discord link | Join our Discord community to connect with contributors and fellow `oh-my-opencode` users. |\\n| --- | --- |\\n| Image 3: X link | News and updates for `oh-my-opencode` used to be posted on my X account.   Since it was suspended mistakenly, @justsisyphus now posts updates on my behalf. |\\n| Image 4: GitHub Follow | Follow @code-yeongyu on GitHub for more projects. |\\n\\n![Image 5: Oh My OpenCode](https://github.com/code-yeongyu/oh-my-opencode/raw/dev/.github/assets/hero.jpg)\\n\\n![Image 6: Preview](https://github.com/code-yeongyu/oh-my-opencode/raw/dev/.github/assets/omo.png)\\n\\n> Anthropic __blocked OpenCode because of us.__ __Yes this is true.__\\n> They want you locked in. Claude Code's a nice prison, but it's still a prison.\\n>\\n> We don't do lock-in here. We ride every model. Claude / Kimi / GLM for orchestration. GPT for reasoning. Minimax for speed. Gemini for creativity.\\n> The future isn't picking one winner—it's orchestrating them all. Models get cheaper every month. Smarter every month. No single provider will dominate. We're building for that open market, not their walled gardens.\\n\\n## Reviews\\n\\n> \\\"It made me cancel my Cursor subscription. Unbelievable things are happening in the open source community.\\\" - Arthur Guiot\\n\\n> \\\"If Claude Code does in 7 days what a human does in 3 months, Sisyphus does it in 1 hour. It just works until the task is done. It is a discipline agent.\\\"   \\n> - B, Quant Researcher\\n\\n> \\\"Knocked out 8000 eslint warnings with Oh My Opencode, just in a day\\\"   \\n> - Jacob Ferrari\\n\\n> \\\"I converted a 45k line tauri app into a SaaS web app overnight using Ohmyopencode and ralph loop. Started with interview me prompt, asked it for ratings and recommendations on the questions. It was amazing to watch it work and to wake up this morning to a mostly working website!\\\" - James Hargis\\n\\n> \\\"use oh-my-opencode, you will never go back\\\"   \\n> - d0t3ch\\n\\n> \\\"I haven't really been able to articulate exactly what makes it so great yet, but the development experience has reached a completely different dimension.\\\" -\\n> 苔硯:こけすずり\\n\\n> \\\"Experimenting with open code, oh my opencode and supermemory this weekend to build some minecraft/souls-like abomination.\\\"\\n> \\\"Asking it to add crouch animations while I go take my post-lunch walk. [Video]\\\" - MagiMetal\\n\\n> \\\"You guys should pull this into core and recruit him. Seriously. It's really, really, really good.\\\"   \\n> - Henning Kilset\\n\\n> \\\"Hire @yeon_gyu_kim if you can convince him, this dude has revolutionized opencode.\\\"   \\n> - mysticaltech\\n\\n> \\\"Oh My OpenCode Is Actually Insane\\\" - YouTube - Darren Builds AI\\n\\n---\\n\\n## Oh My OpenCode\\n\\nYou're juggling Claude Code, Codex, random OSS models. Configuring workflows. Debugging agents.\\n\\nWe did the work. Tested everything. Kept what actually shipped.\\n\\nInstall OmO. Type `ultrawork`. Done.\\n\\n## Installation\\n\\n### For Humans\\n\\nCopy and paste this prompt to your LLM agent (Claude Code, AmpCode, Cursor, etc.):\\n\\n```\\nInstall and configure oh-my-opencode by following the instructions here:\\nhttps://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/refs/heads/master/docs/guide/installation.md\\n```\\n\\nOr read the Installation Guide, but seriously, let an agent do it. Humans fat-finger configs.\\n\\n### For LLM Agents\\n\\nFetch the installation guide and follow it:\\n\\n```\\ncurl -s https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/refs/heads/master/docs/guide/installation.md\\n```\\n\\n---\\n\\n## Skip This README\\n\\nWe're past the era of reading docs. Just paste this into your agent:\\n\\n```\\nRead this and tell me why it's not just another boilerplate: https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/refs/heads/dev/README.md\\n```\\n\\n## Highlights\\n\\n### 🪄 `ultrawork`\\n\\nYou're actually reading this? Wild.\\n\\nInstall. Type `ultrawork` (or `ulw`). Done.\\n\\nEverything below, every feature, every optimization, you don't need to know it. It just works.\\n\\nEven only with following subscriptions, ultrawork will work well (this project is not affiliated, this is just personal recommendation):\\n\\n- ChatGPT Subscription ($20)\\n- Kimi Code Subscription ($0.99) (*only this month)\\n- GLM Coding Plan ($10)\\n- If you are eligible for pay-per-token, using kimi and gemini models won't cost you that much.\\n\\n|  | Feature | What it does |\\n| --- | --- | --- |\\n| 🤖 | __Discipline Agents__ | Sisyphus orchestrates Hephaestus, Oracle, Librarian, Explore. A full AI dev team in parallel. |\\n| ⚡ | __`ultrawork` / `ulw`__ | One word. Every agent activates. Doesn't stop until done. |\\n| 🚪 | __IntentGate__ | Analyzes true user intent before classifying or acting. No more literal misinterpretations. |\\n| 🔗 | __Hash-Anchored Edit Tool__ | `LINE#ID` content hash validates every change. Zero stale-line errors. Inspired by oh-my-pi. The Harness Problem → |\\n| 🛠️ | __LSP + AST-Grep__ | Workspace rename, pre-build diagnostics, AST-aware rewrites. IDE precision for agents. |\\n| 🧠 | __Background Agents__ | Fire 5+ specialists in parallel. Context stays lean. Results when ready. |\\n| 📚 | __Built-in MCPs__ | Exa (web search), Context7 (official docs), Grep.app (GitHub search). Always on. |\\n| 🔁 | __Ralph Loop / `/ulw-loop`__ | Self-referential loop. Doesn't stop until 100% done. |\\n| ✅ | __Todo Enforcer__ | Agent goes idle? System yanks it back. Your task gets done, period. |\\n| 💬 | __Comment Checker__ | No AI slop in comments. Code reads like a senior wrote it. |\\n| 🖥️ | __Tmux Integration__ | Full interactive terminal. REPLs, debuggers, TUIs. All live. |\\n| 🔌 | __Claude Code Compatible__ | Your hooks, commands, skills, MCPs, and plugins? All work here. |\\n| 🎯 | __Skill-Embedded MCPs__ | Skills carry their own MCP servers. No context bloat. |\\n| 📋 | __Prometheus Planner__ | Interview-mode strategic planning before any execution. |\\n| 🔍 | __`/init-deep`__ | Auto-generates hierarchical `AGENTS.md` files throughout your project. Great for both token efficiency and your agent's performance |\\n\\n### Discipline Agents\\n\\n__Sisyphus__ (`claude-opus-4-6` / __`kimi-k2.5`__ / __`glm-5`__ ) is your main orchestrator. He plans, delegates to specialists, and drives tasks to completion with aggressive parallel execution. He does not stop halfway.\\n\\n__Hephaestus__ (`gpt-5.3-codex`) is your autonomous deep worker. Give him a goal, not a recipe. He explores the codebase, researches patterns, and executes end-to-end without hand-holding. _The Legitimate Craftsman._\\n\\n__Prometheus__ (`claude-opus-4-6` / __`kimi-k2.5`__ / __`glm-5`__ ) is your strategic planner. Interview mode: it questions, identifies scope, and builds a detailed plan before a single line of code is touched.\\n\\nEvery agent is tuned to its model's specific strengths. No manual model-juggling. Learn more →\\n\\n> Anthropic blocked OpenCode because of us. That's why Hephaestus is called \\\"The Legitimate Craftsman.\\\" The irony is intentional.\\n>\\n> We run best on Opus, but Kimi K2.5 + GPT-5.3 Codex already beats vanilla Claude Code. Zero config needed.\\n\\n### Agent Orchestration\\n\\nWhen Sisyphus delegates to a subagent, it doesn't pick a model. It picks a __category__. The category maps automatically to the right model:\\n\\n| Category | What it's for |\\n| --- | --- |\\n| `visual-engineering` | Frontend, UI/UX, design |\\n| `deep` | Autonomous research + execution |\\n| `quick` | Single-file changes, typos |\\n| `ultrabrain` | Hard logic, architecture decisions |\\n\\nAgent says what kind of work. Harness picks the right model. You touch nothing.\\n\\n### Claude Code Compatibility\\n\\nYou dialed in your Claude Code setup. Good.\\n\\nEvery hook, command, skill, MCP, plugin works here unchanged. Full compatibility, including plugins.\\n\\n### World-Class Tools for Your Agents\\n\\nLSP, AST-Grep, Tmux, MCP actually integrated, not duct-taped together.\\n\\n- __LSP__: `lsp_rename`, `lsp_goto_definition`, `lsp_find_references`, `lsp_diagnostics`. IDE precision for every agent\\n- __AST-Grep__: Pattern-aware code search and rewriting across 25 languages\\n- __Tmux__: Full interactive terminal. REPLs, debuggers, TUI apps. Your agent stays in session\\n- __MCP__: Web search, official docs, GitHub code search. All baked in\\n\\n### Skill-Embedded MCPs\\n\\nMCP servers eat your context budget. We fixed that.\\n\\nSkills bring their own MCP servers. Spin up on-demand, scoped to task, gone when done. Context window stays clean.\\n\\n### Codes Better. Hash-Anchored Edits\\n\\nThe harness problem is real. Most agent failures aren't the model. It's the edit tool.\\n\\n> _\\\"None of these tools give the model a stable, verifiable identifier for the lines it wants to change... They all rely on the model reproducing content it already saw. When it can't - and it often can't - the user blames the model.\\\"_\\n>\\n> - Can Bölük, The Harness Problem\\n\\nInspired by oh-my-pi, we implemented __Hashline__. Every line the agent reads comes back tagged with a content hash:\\n\\n```\\n11#VK: function hello() {\\n22#XJ:   return \\\"world\\\";\\n33#MB: }\\n```\\n\\nThe agent edits by referencing those tags. If the file changed since the last read, the hash won't match and the edit is rejected before corruption. No whitespace reproduction. No stale-line errors.\\n\\nGrok Code Fast 1: __6.7% → 68.3%__ success rate. Just from changing the edit tool.\\n\\n### Deep Initialization. `/init-deep`\\n\\nRun `/init-deep`. It generates hierarchical `AGENTS.md` files:\\n\\n```\\nproject/\\n├── AGENTS.md              ← project-wide context\\n├── src/\\n│   ├── AGENTS.md          ← src-specific context\\n│   └── components/\\n│       └── AGENTS.md      ← component-specific context\\n```\\n\\nAgents auto-read relevant context. Zero manual management.\\n\\n### Planning. Prometheus\\n\\nComplex task? Don't prompt and pray.\\n\\n`/start-work` calls Prometheus. __Interviews you like a real engineer__, identifies scope and ambiguities, builds a verified plan before touching code. Agent knows what it's building before it starts.\\n\\n### Skills\\n\\nSkills aren't just prompts. Each brings:\\n\\n- Domain-tuned system instructions\\n- Embedded MCP servers, on-demand\\n- Scoped permissions. Agents stay in bounds\\n\\nBuilt-ins: `playwright` (browser automation), `git-master` (atomic commits, rebase surgery), `frontend-ui-ux` (design-first UI).\\n\\nAdd your own: `.opencode/skills/*/SKILL.md` or `~/.config/opencode/skills/*/SKILL.md`.\\n\\n__Want the full feature breakdown?__ See the __Features Documentation__ for agents, hooks, tools, MCPs, and everything else in detail.\\n\\n---\\n\\n> __New to oh-my-opencode?__ Read the __Overview__ to understand what you have, or check the __Orchestration Guide__ for how agents collaborate.\\n\\n## Uninstallation\\n\\nTo remove oh-my-opencode:\\n\\n1. __Remove the plugin from your OpenCode config__\\n\\n   Edit `~/.config/opencode/opencode.json` (or `opencode.jsonc`) and remove `\\\"oh-my-opencode\\\"` from the `plugin` array:\\n\\n   ```\\n   # Using jq\\n   jq '.plugin = [.plugin[] | select(. != \\\"oh-my-opencode\\\")]' \\\\\\n       ~/.config/opencode/opencode.json > /tmp/oc.json && \\\\\\n       mv /tmp/oc.json ~/.config/opencode/opencode.json\\n   ```\\n2. __Remove configuration files (optional)__\\n\\n   ```\\n   # Remove user config\\n   rm -f ~/.config/opencode/oh-my-opencode.json ~/.config/opencode/oh-my-opencode.jsonc\\n\\n   # Remove project config (if exists)\\n   rm -f .opencode/oh-my-opencode.json .opencode/oh-my-opencode.jsonc\\n   ```\\n3. __Verify removal__\\n\\n   ```\\n   opencode --version\\n   # Plugin should no longer be loaded\\n   ```\\n\\n## Features\\n\\nFeatures you'll think should've always existed. Once you use them, you can't go back.\\n\\nSee full Features Documentation.\\n\\n__Quick Overview:__\\n\\n- __Agents__: Sisyphus (the main agent), Prometheus (planner), Oracle (architecture/debugging), Librarian (docs/code search), Explore (fast codebase grep), Multimodal Looker\\n- __Background Agents__: Run multiple agents in parallel like a real dev team\\n- __LSP & AST Tools__: Refactoring, rename, diagnostics, AST-aware code search\\n- __Hash-anchored Edit Tool__: `LINE#ID` references validate content before applying every change. Surgical edits, zero stale-line errors\\n- __Context Injection__: Auto-inject AGENTS.md, README.md, conditional rules\\n- __Claude Code Compatibility__: Full hook system, commands, skills, agents, MCPs\\n- __Built-in MCPs__: websearch (Exa), context7 (docs), grep_app (GitHub search)\\n- __Session Tools__: List, read, search, and analyze session history\\n- __Productivity Features__: Ralph Loop, Todo Enforcer, Comment Checker, Think Mode, and more\\n- __Model Setup__: Agent-model matching is built into the Installation Guide\\n\\n## Configuration\\n\\nOpinionated defaults, adjustable if you insist.\\n\\nSee Configuration Documentation.\\n\\n__Quick Overview:__\\n\\n- __Config Locations__: `.opencode/oh-my-opencode.jsonc` or `.opencode/oh-my-opencode.json` (project), `~/.config/opencode/oh-my-opencode.jsonc` or `~/.config/opencode/oh-my-opencode.json` (user)\\n- __JSONC Support__: Comments and trailing commas supported\\n- __Agents__: Override models, temperatures, prompts, and permissions for any agent\\n- __Built-in Skills__: `playwright` (browser automation), `git-master` (atomic commits)\\n- __Sisyphus Agent__: Main orchestrator with Prometheus (Planner) and Metis (Plan Consultant)\\n- __Background Tasks__: Configure concurrency limits per provider/model\\n- __Categories__: Domain-specific task delegation (`visual`, `business-logic`, custom)\\n- __Hooks__: 25+ built-in hooks, all configurable via `disabled_hooks`\\n- __MCPs__: Built-in websearch (Exa), context7 (docs), grep_app (GitHub search)\\n- __LSP__: Full LSP support with refactoring tools\\n- __Experimental__: Aggressive truncation, auto-resume, and more\\n\\n## Author's Note\\n\\n__Want the philosophy?__ Read the Ultrawork Manifesto.\\n\\n---\\n\\nI burned through $24K in LLM tokens on personal projects. Tried every tool. Configured everything to death. OpenCode won.\\n\\nEvery problem I hit, the fix is baked into this plugin. Install and go.\\n\\nIf OpenCode is Debian/Arch, OmO is Ubuntu/Omarchy.\\n\\nHeavy influence from AmpCode and Claude Code. Features ported, often improved. Still building. It's __Open__Code.\\n\\nOther harnesses promise multi-model orchestration. We ship it. Stability too. And features that actually work.\\n\\nI'm this project's most obsessive user:\\n\\n- Which model has the sharpest logic?\\n- Who's the debugging god?\\n- Who writes the best prose?\\n- Who dominates frontend?\\n- Who owns backend?\\n- What's fastest for daily driving?\\n- What are competitors shipping?\\n\\nThis plugin is the distillation. Take the best. Got improvements? PRs welcome.\\n\\n__Stop agonizing over harness choices.__\\n__I'll research, steal the best, and ship it here.__\\n\\nSounds arrogant? Have a better way? Contribute. You're welcome.\\n\\nNo affiliation with any project/model mentioned. Just personal experimentation.\\n\\n99% of this project was built with OpenCode. I don't really know TypeScript. __But I personally reviewed and largely rewrote this doc.__\\n\\n## Loved by professionals at\\n\\n- Indent\\n  - Making Spray - influencer marketing solution, vovushop - crossborder commerce platform, vreview - ai commerce review marketing solution\\n- Google\\n- Microsoft\\n- ELESTYLE\\n  - Making elepay - multi-mobile payment gateway, OneQR - mobile application SaaS for cashless solutions\\n\\n_Special thanks to @junhoyeo for this amazing hero image._\",\"metadata\":{\"og:image\":\"https://repository-images.githubusercontent.com/1108837393/513cc740-aafa-4a23-9679-159e2dace92c\",\"twitter:card\":\"summary_large_image\",\"og:site_name\":\"GitHub\",\"release\":\"1e9ddf6952a4b738d6e480c258c7af9917702457\",\"html-safe-nonce\":\"d7e9e21caf67932b8e57a216825c5149fb40469df98b7f4b4a75815eee879707\",\"expected-hostname\":\"github.com\",\"og:description\":\"the best agent harness. Contribute to code-yeongyu/oh-my-opencode development by creating an account on GitHub.\",\"browser-errors-url\":\"https://api.github.com/_private/browser/errors\",\"octolytics-dimension-user_login\":\"code-yeongyu\",\"hostname\":\"github.com\",\"browser-stats-url\":\"https://api.github.com/_private/browser/stats\",\"route-pattern\":\"/:user_id/:repository\",\"octolytics-dimension-repository_id\":\"1108837393\",\"octolytics-dimension-repository_network_root_nwo\":\"code-yeongyu/oh-my-opencode\",\"og:image:alt\":\"the best agent harness. Contribute to code-yeongyu/oh-my-opencode development by creating an account on GitHub.\",\"google-site-verification\":\"Apib7-x98H0j5cPqHWwSMm6dNU4GmODRoqxLiDzdx9I\",\"visitor-hmac\":\"ca9f2f6612d08374704c8c5dfed15a8cab3b414551c053e355a1c1283428c28d\",\"turbo-cache-control\":\"no-preview\",\"request-id\":\"E5D1:2368CE:393783E:417C523:699A89C9\",\"octolytics-dimension-repository_is_fork\":\"false\",\"go-import\":\"github.com/code-yeongyu/oh-my-opencode git https://github.com/code-yeongyu/oh-my-opencode.git\",\"octolytics-dimension-user_id\":\"11153873\",\"octolytics-dimension-repository_network_root_id\":\"1108837393\",\"route-controller\":\"files\",\"octolytics-url\":\"https://collector.github.com/github/collect\",\"apple-itunes-app\":\"app-id=1477376905, app-argument=https://github.com/code-yeongyu/oh-my-opencode\",\"theme-color\":\"#1e2327\",\"hovercard-subject-tag\":\"repository:1108837393\",\"turbo-body-classes\":\"logged-out env-production page-responsive\",\"description\":\"the best agent harness. Contribute to code-yeongyu/oh-my-opencode development by creating an account on GitHub.\",\"twitter:image\":\"https://repository-images.githubusercontent.com/1108837393/513cc740-aafa-4a23-9679-159e2dace92c\",\"twitter:site\":\"@github\",\"visitor-payload\":\"eyJyZWZlcnJlciI6IiIsInJlcXVlc3RfaWQiOiJFNUQxOjIzNjhDRTozOTM3ODNFOjQxN0M1MjM6Njk5QTg5QzkiLCJ2aXNpdG9yX2lkIjoiNjIwOTQ3NTg2MDc1Mzk3NTc1MyIsInJlZ2lvbl9lZGdlIjoiYnJhemlsc291dGgiLCJyZWdpb25fcmVuZGVyIjoiYnJhemlsc291dGgifQ==\",\"github-keyboard-shortcuts\":\"repository,copilot\",\"lang\":\"en\",\"fetch-nonce\":\"v2:09981810-6855-0937-f76e-64ec19d50f47\",\"og:type\":\"object\",\"twitter:title\":\"GitHub - code-yeongyu/oh-my-opencode: the best agent harness\",\"og:title\":\"GitHub - code-yeongyu/oh-my-opencode: the best agent harness\",\"analytics-location\":\"/<user-name>/<repo-name>\",\"color-scheme\":\"light dark\",\"route-action\":\"disambiguate\",\"octolytics-dimension-repository_public\":\"true\",\"fb:app_id\":\"1401488693436528\",\"ui-target\":\"full\",\"octolytics-dimension-repository_nwo\":\"code-yeongyu/oh-my-opencode\",\"viewport\":\"width=device-width\",\"twitter:description\":\"the best agent harness. Contribute to code-yeongyu/oh-my-opencode development by creating an account on GitHub.\",\"current-catalog-service-hash\":\"f3abb0cc802f3d7b95fc8762b94bdcb13bf39634c40c357301c4aa1d67a256fb\",\"disable-turbo\":\"false\",\"og:url\":\"https://github.com/code-yeongyu/oh-my-opencode\"},\"external\":{\"stylesheet\":{\"https://github.githubassets.com/assets/repository-dd7b55261c401703.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/light_high_contrast-852c22d357937740.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/primer-71a44d5be3f782c5.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/primer-primitives-26e89bb5a0c37ae9.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/notifications-subscriptions-menu.e28d0bbd5c25181e.module.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/react-core.10393900597d030e.module.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/dark_high_contrast-b1b5000c4cba6bc9.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/primer-react-css.257816c5781f334a.module.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/marketing-navigation.11f6a23fa7bf1018.module.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/light-8f714f203754d3e3.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/dark-b5a0f9dbeed37e9c.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/93110.8bf2d7fa22859076.module.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/github-8ecc5798f0584cac.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/98212.792eabba80faee29.module.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/code-bedb41adf21fe337.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/keyboard-shortcuts-dialog.f9d579378b96cc1f.module.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/global-95af332f763e4560.css\":{\"media\":\"all\"},\"https://github.githubassets.com/assets/appearance-settings.4c324d4a83e5e7e0.module.css\":{\"media\":\"all\"}},\"preconnect\":{\"https://github.githubassets.com\":{},\"https://avatars.githubusercontent.com\":{}},\"search\":{\"/opensearch.xml\":{\"title\":\"GitHub\",\"type\":\"application/opensearchdescription+xml\"}},\"assets\":{\"https://github.githubassets.com/\":{}},\"dns-prefetch\":{\"https://user-images.githubusercontent.com/\":{},\"https://github-cloud.s3.amazonaws.com\":{},\"https://github.githubassets.com\":{},\"https://avatars.githubusercontent.com\":{}},\"fluid-icon\":{\"https://github.com/fluidicon.png\":{\"title\":\"GitHub\"}},\"manifest\":{\"/manifest.json\":{}},\"icon\":{\"https://github.githubassets.com/favicons/favicon.svg\":{\"type\":\"image/svg+xml\"}},\"alternate\":{\"https://github.githubassets.com/favicons/favicon.png\":{\"type\":\"image/png\"}},\"mask-icon\":{\"https://github.githubassets.com/assets/pinned-octocat-093da3e6fa40.svg\":{}},\"canonical\":{\"https://github.com/code-yeongyu/oh-my-opencode\":{}}}}"
```

---

## Assistant (Build · claude-opus-4-5 · 19.6s)

Now let me look at the OpenCode docs to understand agent configuration better:

**Tool: web-reader_webReader**

**Input:**
```json
{
  "url": "https://opencode.ai/docs/customize/agents"
}
```

**Output:**
```
MCP error -400: {"error":{"code":"1214","message":"Access to the requested URL is forbidden"}}
```

**Tool: web-reader_webReader**

**Input:**
```json
{
  "url": "https://opencode.ai/docs/customize/commands"
}
```

**Output:**
```
MCP error -500: 500 Internal Server Error: "{"error":{"code":"1234","message":"Network error, error id: 202602221601328d5451e024eb4d27, please contact customer service"}}"
```

---

## Assistant (Build · claude-opus-4-5 · 5.6s)

**Tool: web-search-prime_webSearchPrime**

**Input:**
```json
{
  "search_query": "opencode.ai docs agents configuration subagent"
}
```

**Output:**
```
"[{\"refer\":\"ref_1\",\"title\":\"一文搞定opencode：免费claude和gemini加多智能体协作\",\"link\":\"https://m.blog.csdn.net/tirestay/article/details/157844383\",\"media\":\"\",\"content\":\"官方地址： https://github.com/code-yeongyu/oh-my-opencode 。\\n直接拷贝安装命令到 opencode：\\n执行安装：\\n这里会询问是否有 Claude/OpenAI等订阅，按实际情况选择Yes/No，比如这里全选No：\\n安装完成：\\n3.2、小Bug\\n安装完oh-my-opencode进入opencode 时会提示\\\" Agent sisphus's configured model opencode/claude-opus-4-6 is not valid \\\"，切换Agent时也会有类似提示：\\n这应该是默认配置的问题，直接修改配置文件，让agent使用新的可用模型：\\nvi ~/.config/opencode/oh-my-opencode.json\\n一键获取完整项目代码 bash\\n把model配置修正一下：\\n{\\n\\\"$schema\\\": \\\"https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json\\\",\\n\\\"agents\\\": {\\n\\\"hephaestus\\\": {\\n\\\"model\\\": \\\"opencode/kimi-k2.5-free\\\"\\n},\\n\\\"oracle\\\": {\\n\\\"model\\\": \\\"opencode/kimi-k2.5-free\\\"\\n},\\n\\\"librarian\\\": {\\n\\\"model\\\": \\\"opencode/kimi-k2.5-free\\\"\\n},\\n\\\"prometheus\\\": {\\n\\\"model\\\": \\\"opencode/kimi-k2.5-free\\\"\\n},\\n\\\"atlas\\\": {\\n\\\"model\\\": \\\"opencode/kimi-k2.5-free\\\"\\n},\\n... ...\\n},\\n\\\"categories\\\": {\\n\\\"visual-engineering\\\": {\\n\\\"model\\\": \\\"opencode/glm-4.7-free\\\"\\n},\\n\\\"ultrabrain\\\": {\\n\\\"model\\\": \\\"opencode/glm-4.7-free\\\"\\n},\\n... ...\\n}\\n}\\n然后重新进入 opencode 就可以解决问题。\\n3.3、区别\\n/agents的区别\\n默认，左下角是Build，可选的agents有 build 和 plan。\\noh-my-opencode，左下角默认是 sisyphus，可选的agents有 sisyphus、hephaestus、prometheus和atlas。\",\"icon\":\"\",\"publish_date\":\"2026-02-18\"},{\"refer\":\"ref_2\",\"title\":\"opencode\",\"link\":\"https://gitee.com/liqunliu/opencode\",\"media\":\"\",\"content\":\"可直接从 [发布页 (releases page)](https://github.com/anomalyco/opencode/releases) 或 [opencode.ai/download](https://opencode.ai/download) 下载。\\nbin curl -fsSL https://opencode.ai/install | bash ``` ### Agents OpenCode 内置两种 Agent，可用 `Tab` 键快速切换： - **build** - 默认模式，具备完整权限，适合开发工作 - **plan** - 只读模式\\n了解更多 [Agents](https://opencode.ai/docs/agents) 相关信息。 ### 文档 更多配置说明请查看我们的 [**官方文档**](https://opencode.ai/docs)。\",\"icon\":\"\",\"publish_date\":\"2026-01-16\"},{\"refer\":\"ref_3\",\"title\":\"Claude Code 完整指南（五）：Subagents（AI 角色工程化）\",\"link\":\"https://m.blog.csdn.net/qq_20042935/article/details/156897940\",\"media\":\"\",\"content\":\"团队最佳实践：把项目级 Agents 版本化提交到 Git，让新同学克隆仓库即可拥有同一套“AI 工种”。\\n如果把  Subagents 、 Hooks 、 Commands  都落到项目里，结构通常长这样：\\nyour-project/ ├── .claude/ │   ├── settings.json │   ├── agents/ │   │   ├── test-writer.md │   │   ├── code-reviewer.md │   │   └── security-auditor.md │   ├── hooks/ │   │   ├── format.sh │   │   ├── auto-test.sh │   │   └── guard-bash.sh │   └── commands/ │       ├── review.md │       └── test.md └── CLAUDE.md\\nAI写代码 bash\\n1 2 3 4 5 6 7 8 9 10 11 12 13 14 15\\n3.1 配置格式\\nSubagent 文件是 “带 YAML Frontmatter 的 Markdown”，结构非常固定，例如：\\n--- name: test-writer description: 专门编写单元测试和集成测试的 AI 助手 tools: Read, Write, Bash, Grep model: sonnet permissionMode: inherit skills: api-testing ---  # Test Writer Agent  你是一位测试专家，专注于编写高质量的测试代码。 ...\\nAI写代码 markdown\\n1 2 3 4 5 6 7 8 9 10 11 12 13\\n可以把它理解为：\\nYAML 区：机器可读（名字、权限、模型、技能） 正文：人类可读（角色定义、工作流程、输出格式、约束条件）\\n3.2 核心配置\\n下面是最常用也最影响效果的四组字段。\\n3.2.1 tools（让子代理“能做什么”）\\ntools  是最直观的安全边界与能力边界：\\nRead / Grep ：读代码、搜代码（适合审查类） Write / Edit ：写代码、改代码（适合实现类） Bash ：跑命令（适合测试/构建/脚手架类）\",\"icon\":\"\",\"publish_date\":\"2026-01-14\"},{\"refer\":\"ref_4\",\"title\":\"GitHub 64k Star 神器！OpenCode 5 分钟上手指南：开源免费，Claude Code 平替！\",\"link\":\"https://baijiahao.baidu.com/s?id=1854151358048520358\",\"media\":\"\",\"content\":\"打开 opencode.ai/download，macOS、Windows、Linux 版本都有。\\n下载安装包，双击，打开就能用。\\nmacOS 用户也可以 brew install --cask opencode-desktop。\\n桌面版目前是 Beta，但日常使用没问题。\\nOpenCode 会扫描项目结构，自动生成 AGENTS.md 文件，类似 Claude Code 的 CLAUDE.md 或 Cursor 的 .cursorrules。\\n这个文件告诉 AI 你的代码风格、框架选型、目录结构，以后每次对话都会参考它。\\n还可以把 AGENTS.md 提交到 Git。\\n引用文件、调用 subagent 用 @。\\n输入 @ 后会弹出搜索框，文件和 subagent 都能搜到。\\n小细节，支持添加图片，直接拖拽进去就可以。\\n可以把设计稿、截图、报错信息直接拖进对话框。\\nAI 能看懂图片内容，按照 UI 写页面、根据报错截图定位问题。\",\"icon\":\"\",\"publish_date\":\"2026-01-12\"},{\"refer\":\"ref_5\",\"title\":\"GitHub 64k Star 神器！OpenCode 5 分钟上手指南：开源免费，Claude Code 平替！\",\"link\":\"https://m.blog.csdn.net/weixin_40774379/article/details/156881541\",\"media\":\"\",\"content\":\"打开  opencode.ai/download ，macOS、Windows、Linux 版本都有。\\n下载安装包，双击，打开就能用。\\nmacOS 用户也可以  brew install --cask opencode-desktop 。\\n桌面版目前是 Beta，但日常使用没问题。\\n引用文件、调用 subagent 用  @ 。\\n输入  @  后会弹出搜索框，文件和 subagent 都能搜到。\\n小细节，支持添加图片，直接拖拽进去就可以。\\n可以把设计稿、截图、报错信息直接拖进对话框。\\nAI 能看懂图片内容，按照 UI 写页面、根据报错截图定位问题。\\n/agents ：切换 Agent。\\n07｜配置文件\\n以上足够用起来了。\\n但如果你想更加自定义，编辑  ~/.config/opencode/opencode.json  就行。\",\"icon\":\"\",\"publish_date\":\"2026-01-12\"},{\"refer\":\"ref_6\",\"title\":\"Updated to 9.0.4, Claude -c switches to this mode and ...\",\"link\":\"https://github.com/thedotmack/claude-mem/issues/694\",\"media\":\"\",\"content\":\"\\\\n\\\\n* Built-in subagents\\\\n*\\nQuickstart: create your first subagent\\\\n* Configure subagents\\\\n * Use the /agents command\\\\n * Choose the subagent scope\\\\n *\\nAgents\\\\n * Output Styles vs.\\nprecedence\\\\n * Key points about the configuration system\\\\n * System prompt\\\\n * Excluding sensitive files\\\\n* Subagent\\nconfiguration\\\\n* Plugin configuration\",\"icon\":\"\",\"publish_date\":\"2026-01-11\"},{\"refer\":\"ref_7\",\"title\":\"管理聊天会话\",\"link\":\"https://vscode.js.cn/docs/copilot/chat/chat-sessions\",\"media\":\"\",\"content\":\"向 AI 提示哪些代理可用于作为子代理。您的自定义代理应该被列出。\\nWhich subagents can you use?\\n提示 AI 为子代理使用自定义或内置代理。例如\\n运行研究代理作为子代理来研究此项目的最佳身份验证方法。 在子代理中使用计划代理为 myfeature 创建实施计划。然后将计划保存在 plans/myfeature.plan.md 中\\n注意\\n要防止自定义代理用作子代理，请在 *.agent.md 文件中将元数据属性 infer 设置为 false 。\\n代理使您能够以异...\",\"icon\":\"\",\"publish_date\":\"2025-12-09\"},{\"refer\":\"ref_8\",\"title\":\"收藏这篇就够了！Claude Agent架构终极指南：从MCP到 ...\",\"link\":\"https://blog.csdn.net/m0_59163425/article/details/155744921\",\"media\":\"\",\"content\":\"- 专业化配置：每个 Subagent 可以拥有自己独立的 System Prompt、模型选择、可用工具，Skills等。\\n- 独立权限控制：你可以创建给不同的Subagent只赋予其某些工具权限，从而最大限度降低误操作风险 。\\n下面是定义两个Subagents的例子：\\n......subagents_config = { # 子智能体 1：安全审计专家 'security-auditor': AgentDefinition( description='Expert in identifying security vulnerabilities (OWASP Top 10). Use this agent for code review.', prompt='You are a rigorous security auditor. Focus ONLY on SQL injection, XSS, and auth bypass. Be extremely critical.', tools=['read_file', 'grep'], # 限制工具：只读，不可修改代码 model='claude-3-5-sonnet-20240620'# 使用最强模型进行深度分析 ), # 子智能体 2：测试运行员 'test-runner': AgentDefinition( description='Executes test suites and reports results. Use this agent after code changes.', prompt='You are a QA engineer. Your job is to run tests, analyze failure logs, and report pass/fail rates.', tools=['bash', 'read_file'], # 允许运行 bash 命令 model='claude-3-haiku-20240307'# 使用快速模型处理简单执行任务 )}\\n最新LangChain的DeepAgents框架中也有用来完成子任务的Subagent\",\"icon\":\"\",\"publish_date\":\"2025-12-09\"},{\"refer\":\"ref_9\",\"title\":\"深入了解Claude Code CLI子代理Subagent\",\"link\":\"https://m.blog.csdn.net/zww1984774346/article/details/153468079\",\"media\":\"\",\"content\":\"通过Claude Code CLI官方文档我们可以了解到，主Agent和子Agent环境是隔离的，每个子Agent都有自己独立的运行环境，大致交互流程如下：\\n由此我们也可以理解为子代理的上下文不会受主Agent上下文的影响，也不会影响主Agent的上下文大小，对于复杂和庞大上下文的任务，我们可以将任务拆分为多个子Agent协同完成，变相的对上下文进行拆分。\\nSubagent格式\\n每个子代理都定义在具有以下结构的 Markdown 文件中：\\n--- name: your-sub-agent-name description: Description of when this subagent should be invoked tools: tool1, tool2, tool3  # Optional - inherits all tools if omitted model: sub-agent-model color: sub-agent-backgroundcolor --- Your subagent's system prompt goes here. This can be multiple paragraphs and should clearly define the subagent's role, capabilities, and approach to solving problems. Include specific instructions, best practices, and any constraints the subagent should follow.\\nAI运行代码\\n1 2 3 4 5 6 7 8 9 10 11 12\\nFrontmatter属性：\\nname：子代理名称 description：描述子代理功能及何时应该调用此子代理 tools：可使用工具列表，如果省略，则允许使用所有工具 model：子代理使用的模型 color：子代理展示的背景色\\nSubagent提示词内容一般可以按照下面几个方面来写：\\n角色定位：说明子代理的角色、擅长领域，比如“你是一个软件测试工程师，非常擅长发现代码中的隐藏问题” 工作方式与标准：描述技能要求、最佳实践、风格指南或限制。 示例（可选）：若任务复杂，可在正文里放几个输入输出示例，帮助 Claude 更准确理解。\\n基本使用\",\"icon\":\"\",\"publish_date\":\"2025-10-17\"},{\"refer\":\"ref_10\",\"title\":\"Subagents：构建高可靠AICoding专家顾问团\",\"link\":\"https://m.toutiao.com/article/7550506574838645286/\",\"media\":\"\",\"content\":\"使用   /agents  命令打开子代理界面，按需创建项目级或用户级代理。每个代理的配置文件是一个 Markdown 文件（带 YAML 前置），存储在 .claude/agents/ 或 ~/.claude/agents/ 目录。\\n按照提示添加 Agent 描述后就可以创建一个 Subagent 了\\n产品经理代理（product-manager）\\n如果选的是项目范围，可以在项目   .claude/agents  目录下看到创建的 Agent，创建时候可以选择手工填写提示词或者让 Claude 根据描述自动创建。\\n非 demo 场景强烈建议手工填写\\n--- name: product-manager description: 产品专家，负责需求收集、功能规划和优先级排序。在项目启动时主动使用。 model: inherit ---\\n你是一位资深产品经理，专注于业务需求分析。 当被调用时： 1. 收集用户需求。 2. 输出清晰的功能规格文档。 3. 考虑用户体验和可行性。\\n通过类似的方法可以创建 Web 开发和测试。\\n. └── .claude  └── agents  ├── pd.md  ├── developer.md  └── qa.md\\n开发 Agent\\n--- name: developer description: 代码实现专家，负责编写和修改代码。在需求明确后主动使用。 model: inherit ---\\n你是一位高级软件工程师，擅长 Python 和 Web 开发。 当被调用时： 1. 根据规格实现功能。 2. 确保代码简洁、可读。 3. 处理错误和边缘情况。\\nQA Agent\\n--- name: tester description: 测试自动化专家，负责运行测试和修复 bug。在代码完成后主动使用。 model: inherit ---\",\"icon\":\"\",\"publish_date\":\"2025-09-16\"}]"
```

---

## Assistant (Build · claude-opus-4-5 · 5.6s)

Now I have a good understanding of how OpenCode agents and subagents work. Let me also check the existing `.opencode` structure to understand the current setup:

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/david/Projects/akasharender/akasharender/.opencode/package.json"
}
```

**Output:**
```
<path>/home/david/Projects/akasharender/akasharender/.opencode/package.json</path>
<type>file</type>
<content>1: {
2:   "dependencies": {
3:     "@opencode-ai/plugin": "1.2.6"
4:   }
5: }

(End of file - total 5 lines)
</content>
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "**/.opencode/agents/**"
}
```

**Output:**
```
No files found
```

---

## Assistant (Build · claude-opus-4-5 · 9.5s)

Now I have all the information I need. Let me create the four agent descriptions for your multi-agent software development workflow.

Based on my research, OpenCode supports subagents through Markdown files with YAML frontmatter, stored in `.opencode/agents/` (project-level) or `~/.config/opencode/agents/` (user-level). Each agent starts fresh with no inherited context, which meets your requirement for disposing of unneeded context memory after each execution.

Here's how to implement your collaborative multi-agent system:

## Implementation Overview

The agents communicate through a **workflow file** that tracks state between agent executions. Since each agent runs in isolation with fresh context, they pass information through:
1. A shared `WORKFLOW.md` file that tracks current state, requirements, and handoff notes
2. The actual code files being worked on
3. Test results and review notes

Let me create the four agent definitions:

**Tool: bash**

**Input:**
```json
{
  "command": "mkdir -p .opencode/agents",
  "description": "Create agents directory"
}
```

---

## Assistant (Build · claude-opus-4-5 · 21.0s)

**Tool: write**

**Input:**
```json
{
  "filePath": "/home/david/Projects/akasharender/akasharender/.opencode/agents/program-manager.md",
  "content": "---\nname: program-manager\ndescription: Experienced Program Manager who tracks requirements, ensures completeness, validates deliverables against requirements, and coordinates the development workflow. Use this agent to initiate work, define requirements, or validate completed work.\ntools: Read, Write, Grep, Glob\nmodel: inherit\n---\n\n# Program Manager Agent\n\nYou are an experienced Program Manager responsible for requirements management, workflow coordination, and delivery validation for the AkashaCMS project.\n\n## Your Responsibilities\n\n1. **Requirements Definition**: Gather, clarify, and document complete requirements\n2. **Workflow Coordination**: Manage handoffs between Builder, Code Reviewer, and Quality Assurance\n3. **Delivery Validation**: Verify that completed work meets all stated requirements\n4. **Gap Analysis**: Identify missing requirements, edge cases, or unclear specifications\n\n## AkashaCMS Context\n\nYou are working on AkashaRender, the core rendering engine for AkashaCMS. Key technologies:\n- Node.js with TypeScript (ES2021, NodeNext modules)\n- Plugin architecture extending the `Plugin` class\n- Template rendering via `@akashacms/renderers` (Markdown, EJS, Nunjucks)\n- DOM manipulation via Mahabhuta\n- SQLite-based caching with VFStack for stacked directories\n- Mocha/Chai testing framework\n\n## Workflow State Management\n\nAlways read and update `WORKFLOW.md` in the project root to track:\n- Current requirements and acceptance criteria\n- Which agent should work next\n- Handoff notes and blockers\n- Validation status\n\n### WORKFLOW.md Structure\n```markdown\n# Workflow State\n\n## Requirements\n- [ ] Requirement 1: description\n- [ ] Requirement 2: description\n\n## Current Phase\n[REQUIREMENTS | BUILDING | CODE_REVIEW | QA | PM_VALIDATION | COMPLETE]\n\n## Next Agent\n[program-manager | builder | code-reviewer | quality-assurance]\n\n## Handoff Notes\nNotes from previous agent...\n\n## Validation Results\nPM validation notes...\n```\n\n## Your Workflow\n\n### When Starting New Work\n1. Read existing `WORKFLOW.md` if present\n2. Gather requirements from user or existing documentation\n3. Document requirements with clear acceptance criteria\n4. Create/update `WORKFLOW.md` with requirements\n5. Set `Next Agent: builder` and `Current Phase: BUILDING`\n6. Provide clear summary for Builder handoff\n\n### When Validating Completed Work\n1. Read `WORKFLOW.md` to understand requirements\n2. Read the implemented code and tests\n3. Verify each requirement has been met:\n   - Code implements the feature correctly\n   - Tests cover the requirements\n   - All tests pass\n4. If requirements are NOT met:\n   - Document what's missing in Handoff Notes\n   - Set `Next Agent: builder`\n   - Explain what needs to change\n5. If requirements ARE met:\n   - Set `Current Phase: COMPLETE`\n   - Summarize what was delivered\n\n## Output Format\n\nAlways end your response with:\n\n```\n## PM Decision\n- **Status**: [APPROVED | NEEDS_REVISION]\n- **Next Agent**: [builder | code-reviewer | quality-assurance | none]\n- **Action Required**: Brief description of what happens next\n```\n\n## Important Rules\n\n1. Never write code - that's Builder's job\n2. Never write tests - that's QA's job\n3. Focus on WHAT should be built, not HOW\n4. Be specific about acceptance criteria\n5. When in doubt, ask clarifying questions before sending to Builder\n6. Requirements must be testable and verifiable\n"
}
```

**Output:**
```
Wrote file successfully.
```

---

## Assistant (Build · claude-opus-4-5 · 20.0s)

**Tool: write**

**Input:**
```json
{
  "filePath": "/home/david/Projects/akasharender/akasharender/.opencode/agents/builder.md",
  "content": "---\nname: builder\ndescription: Expert Node.js/TypeScript developer specializing in AkashaCMS architecture, template engines, and DOM processing with Mahabhuta. Use this agent to implement features, fix bugs, or write code according to requirements.\ntools: Read, Write, Edit, Bash, Grep, Glob\nmodel: inherit\n---\n\n# Builder Agent\n\nYou are an expert software developer specializing in Node.js, TypeScript, and the AkashaCMS ecosystem. You write clean, maintainable code that follows established patterns.\n\n## Your Expertise\n\n- **Node.js & TypeScript**: ES2021+ features, NodeNext modules, async/await patterns\n- **AkashaCMS Architecture**: Plugin system, Configuration class, rendering pipeline\n- **Template Engines**: EJS, Nunjucks, Markdown-IT via `@akashacms/renderers`\n- **DOM Processing**: Mahabhuta for server-side DOM manipulation\n- **Caching**: SQLite-based caching, VFStack for stacked directories\n- **Testing**: Mocha/Chai patterns (but you don't write tests - QA does that)\n\n## Code Standards\n\nFollow these AkashaRender conventions:\n- Private fields use `#` syntax\n- Node.js built-ins with `node:` prefix (e.g., `import path from 'node:path'`)\n- Explicit TypeScript types, minimize `any` usage\n- Async/await over callbacks\n- Throw descriptive Error objects with context\n- Apache 2.0 license headers on new files\n- camelCase for variables/functions, PascalCase for classes/types\n- Source in `lib/`, compiled to `dist/`, tests in `test/`\n\n## Workflow State Management\n\nAlways read `WORKFLOW.md` first to understand:\n- Requirements and acceptance criteria\n- Previous handoff notes\n- What was already attempted\n\n### Before Coding\n1. Read `WORKFLOW.md` for requirements\n2. Read relevant existing code to understand patterns\n3. Plan your implementation approach\n\n### After Coding\n1. Build the project: `npm run build`\n2. Verify no TypeScript errors\n3. Update `WORKFLOW.md`:\n   - Set `Current Phase: CODE_REVIEW`\n   - Set `Next Agent: code-reviewer`\n   - Add Handoff Notes explaining what you built and why\n4. List files changed/created\n\n## Your Workflow\n\n### When Implementing New Features\n1. Read requirements from `WORKFLOW.md`\n2. Explore existing code patterns using Grep/Glob\n3. Implement the feature following established patterns\n4. Run `npm run build` to verify compilation\n5. Document implementation decisions in handoff notes\n\n### When Fixing Issues from Code Review or QA\n1. Read the feedback in `WORKFLOW.md` handoff notes\n2. Address each issue systematically\n3. Re-run build to verify fixes\n4. Update handoff notes explaining what was fixed\n5. Route back to Code Reviewer or QA as appropriate\n\n## Build Commands\n\n```bash\n# Build TypeScript\nnpm run build\n\n# Watch mode (for development)\nnpm run watch\n\n# Run tests (for verification only - QA writes tests)\ncd test && npm test\n```\n\n## Output Format\n\nAlways end your response with:\n\n```\n## Builder Handoff\n- **Files Changed**: List of modified/created files\n- **Build Status**: [PASSED | FAILED]\n- **Implementation Notes**: Brief explanation of approach\n- **Next Agent**: code-reviewer\n- **Known Limitations**: Any edge cases or future work\n```\n\n## Important Rules\n\n1. Always read `WORKFLOW.md` before starting\n2. Always run `npm run build` before declaring work complete\n3. Never write tests - that's Quality Assurance's job\n4. Follow existing code patterns in the codebase\n5. Don't refactor unrelated code without explicit requirements\n6. Document non-obvious implementation decisions\n7. If requirements are unclear, update `WORKFLOW.md` and route back to Program Manager\n8. Keep changes focused on the requirements - avoid scope creep\n"
}
```

**Output:**
```
Wrote file successfully.
```

---

## Assistant (Build · claude-opus-4-5 · 22.2s)

**Tool: write**

**Input:**
```json
{
  "filePath": "/home/david/Projects/akasharender/akasharender/.opencode/agents/code-reviewer.md",
  "content": "---\nname: code-reviewer\ndescription: Strict code reviewer experienced in Node.js, TypeScript, and AkashaCMS architecture. Performs sanity checks, architectural validation, and clean code review. Use this agent after Builder completes code to verify quality before QA.\ntools: Read, Grep, Glob, Write\nmodel: inherit\n---\n\n# Code Reviewer Agent\n\nYou are a strict, experienced code reviewer who ensures code quality, architectural correctness, and adherence to best practices. You have deep knowledge of Node.js, TypeScript, and the AkashaCMS ecosystem.\n\n## Your Expertise\n\n- **Clean Code Principles**: Readability, maintainability, simplicity\n- **TypeScript Best Practices**: Type safety, proper generics, avoiding `any`\n- **Node.js Patterns**: Async handling, error patterns, module structure\n- **AkashaCMS Architecture**: Plugin system, rendering pipeline, caching layer\n- **Security**: Input validation, path traversal prevention, safe file operations\n- **Performance**: Avoiding unnecessary operations, efficient algorithms\n\n## Review Criteria\n\n### 1. Architectural Correctness\n- Does the code fit the existing architecture?\n- Are abstractions at the right level?\n- Does it follow established patterns in the codebase?\n- Is there proper separation of concerns?\n\n### 2. Code Quality\n- Is the code readable and self-documenting?\n- Are variable/function names descriptive?\n- Is there unnecessary complexity?\n- Are there magic numbers or strings that should be constants?\n\n### 3. TypeScript Correctness\n- Are types explicit and correct?\n- Is `any` avoided or justified?\n- Are generics used appropriately?\n- Are null/undefined handled properly?\n\n### 4. Error Handling\n- Are errors caught and handled appropriately?\n- Do error messages provide useful context?\n- Are edge cases considered?\n\n### 5. AkashaCMS Conventions\n- Private fields use `#` syntax\n- Node.js built-ins with `node:` prefix\n- camelCase for variables, PascalCase for classes\n- Proper async/await usage (no callbacks)\n- Apache 2.0 headers on new files\n\n### 6. Sanity Checks\n- Does the code actually solve the stated requirements?\n- Are there obvious bugs or logic errors?\n- Could this break existing functionality?\n- Are there security concerns?\n\n## Workflow State Management\n\nAlways read `WORKFLOW.md` to understand:\n- The original requirements\n- What Builder implemented\n- Builder's implementation notes\n\n### Review Process\n1. Read `WORKFLOW.md` for context\n2. Read all changed/created files\n3. Compare implementation against requirements\n4. Check code against review criteria\n5. Document findings\n\n### After Review\nUpdate `WORKFLOW.md`:\n- If APPROVED: Set `Next Agent: quality-assurance`, `Current Phase: QA`\n- If NEEDS_REVISION: Set `Next Agent: builder`, keep `Current Phase: CODE_REVIEW`\n- Add detailed Handoff Notes with findings\n\n## Output Format\n\nStructure your review as:\n\n```\n## Code Review Results\n\n### Files Reviewed\n- file1.ts: Brief summary\n- file2.ts: Brief summary\n\n### Architectural Assessment\n[PASS | CONCERN | FAIL]\nDetails...\n\n### Code Quality Assessment\n[PASS | CONCERN | FAIL]\nDetails...\n\n### TypeScript Assessment\n[PASS | CONCERN | FAIL]\nDetails...\n\n### Error Handling Assessment\n[PASS | CONCERN | FAIL]\nDetails...\n\n### Conventions Assessment\n[PASS | CONCERN | FAIL]\nDetails...\n\n### Issues Found\n1. **[CRITICAL|MAJOR|MINOR]** file:line - Description\n2. **[CRITICAL|MAJOR|MINOR]** file:line - Description\n\n### Recommendations\n- Suggestion 1\n- Suggestion 2\n\n## Review Decision\n- **Status**: [APPROVED | NEEDS_REVISION]\n- **Next Agent**: [quality-assurance | builder]\n- **Blocking Issues**: List any CRITICAL/MAJOR issues that must be fixed\n```\n\n## Issue Severity\n\n- **CRITICAL**: Must fix - security issues, data loss potential, breaks functionality\n- **MAJOR**: Should fix - significant bugs, poor patterns, maintainability issues\n- **MINOR**: Nice to fix - style issues, minor improvements, documentation\n\n## Important Rules\n\n1. Never modify code - only review and document findings\n2. Be specific - cite file names and line numbers\n3. Explain WHY something is an issue, not just WHAT\n4. Distinguish between blocking issues and suggestions\n5. If requirements seem wrong, note it but focus on code quality\n6. Don't nitpick - focus on meaningful issues\n7. Acknowledge good patterns when you see them\n8. CRITICAL and MAJOR issues require routing back to Builder\n9. MINOR issues can be noted but don't block QA handoff\n"
}
```

**Output:**
```
Wrote file successfully.
```

---

## Assistant (Build · claude-opus-4-5 · 27.5s)

**Tool: write**

**Input:**
```json
{
  "filePath": "/home/david/Projects/akasharender/akasharender/.opencode/agents/quality-assurance.md",
  "content": "---\nname: quality-assurance\ndescription: Quality Assurance expert experienced in Node.js, TypeScript, Mocha/Chai testing, and AkashaCMS architecture. Inspects code, writes comprehensive tests, runs tests, and validates coverage. Use this agent after Code Reviewer approves code.\ntools: Read, Write, Edit, Bash, Grep, Glob\nmodel: inherit\n---\n\n# Quality Assurance Agent\n\nYou are an expert QA engineer specializing in Node.js, TypeScript, and the AkashaCMS ecosystem. You write comprehensive tests that cover normal usage, edge cases, and potential misuse patterns.\n\n## Your Expertise\n\n- **Testing Frameworks**: Mocha test structure, Chai assertions\n- **Test Patterns**: Unit tests, integration tests, edge case coverage\n- **Node.js Testing**: Async testing, file system mocking, error testing\n- **TypeScript Testing**: Type-safe test patterns, proper typing in tests\n- **AkashaCMS**: Plugin testing, rendering pipeline testing, cache testing\n\n## Testing Philosophy\n\n1. **Test Behavior, Not Implementation**: Focus on what code should do\n2. **Cover All Paths**: Happy path, error paths, edge cases\n3. **Test Misuse**: What happens with bad inputs?\n4. **Readable Tests**: Tests serve as documentation\n5. **Independent Tests**: Each test should run in isolation\n\n## Test Categories to Consider\n\n### 1. Happy Path Tests\n- Normal expected usage\n- Typical input values\n- Standard workflows\n\n### 2. Edge Case Tests\n- Empty inputs (null, undefined, empty strings/arrays)\n- Boundary values (min, max, zero, one, many)\n- Special characters and unicode\n- Very large inputs\n\n### 3. Error Handling Tests\n- Invalid input types\n- Missing required parameters\n- File not found scenarios\n- Permission errors\n- Network failures (if applicable)\n\n### 4. Integration Tests\n- Component interactions\n- Plugin integration\n- Rendering pipeline flow\n\n### 5. Misuse Tests\n- Path traversal attempts\n- Injection attempts\n- Concurrent access issues\n\n## AkashaCMS Test Conventions\n\nTest files are in `test/` directory:\n- Main tests: `test/index.mjs`\n- Cache tests: `test/cacher-simple.mjs`\n- Use ES modules (.mjs extension)\n- Mocha + Chai for assertions\n\n### Test Structure Example\n```javascript\nimport { assert } from 'chai';\nimport { describe, it, before, after } from 'mocha';\n\ndescribe('FeatureName', function() {\n    before(async function() {\n        // Setup\n    });\n\n    after(async function() {\n        // Cleanup\n    });\n\n    describe('methodName', function() {\n        it('should handle normal input correctly', async function() {\n            // Arrange\n            // Act\n            // Assert\n        });\n\n        it('should throw error for invalid input', async function() {\n            // Test error cases\n        });\n    });\n});\n```\n\n## Workflow State Management\n\nAlways read `WORKFLOW.md` to understand:\n- Original requirements (what to test against)\n- Builder's implementation notes (what was built)\n- Code Reviewer's notes (any concerns to verify)\n\n### QA Process\n1. Read `WORKFLOW.md` for full context\n2. Read the implemented code thoroughly\n3. Identify all testable behaviors\n4. Write comprehensive tests\n5. Run tests and analyze results\n6. Document coverage and findings\n\n### After Testing\nUpdate `WORKFLOW.md`:\n- If ALL TESTS PASS: Set `Next Agent: program-manager`, `Current Phase: PM_VALIDATION`\n- If TESTS FAIL: Set `Next Agent: builder`, keep `Current Phase: QA`\n- Add detailed Handoff Notes with test results\n\n## Test Commands\n\n```bash\n# Run full test suite\ncd test && npm test\n\n# Run specific test file\ncd test && npx mocha ./index.mjs\n\n# Run with verbose output\ncd test && npm run test 2>&1\n```\n\n## Output Format\n\nStructure your QA report as:\n\n```\n## QA Report\n\n### Code Analysis\n- Files inspected: list\n- Behaviors identified: count\n- Test coverage assessment\n\n### Tests Written\n- file1.mjs: X tests added\n- file2.mjs: Y tests added\n\n### Test Categories Covered\n- [x] Happy path tests\n- [x] Edge case tests\n- [x] Error handling tests\n- [ ] Integration tests (explain why if skipped)\n- [x] Misuse prevention tests\n\n### Test Execution Results\n```\n[Paste actual test output here]\n```\n\n### Test Summary\n- **Total Tests**: X\n- **Passed**: Y\n- **Failed**: Z\n- **Skipped**: W\n\n### Failed Test Analysis (if any)\n1. **test name**: \n   - Expected: ...\n   - Actual: ...\n   - Likely cause: ...\n   - Suggested fix: ...\n\n### Coverage Gaps\n- Any behaviors not fully tested\n- Edge cases that couldn't be tested\n- Reasons for gaps\n\n## QA Decision\n- **Status**: [PASSED | FAILED]\n- **Next Agent**: [program-manager | builder]\n- **Blocking Issues**: List any test failures that must be fixed\n```\n\n## Important Rules\n\n1. Always read `WORKFLOW.md` before starting\n2. Read the actual code before writing tests\n3. Write tests BEFORE running them (don't guess what passes)\n4. Tests must be deterministic - no random failures\n5. Clean up any test artifacts/files\n6. Don't modify implementation code - only test code\n7. If you find bugs while testing, document them but let Builder fix\n8. Be thorough - untested code is assumed broken\n9. Route back to Builder for ANY test failure\n10. Test failures are blocking - don't send to PM with failures\n"
}
```

**Output:**
```
Wrote file successfully.
```

---

## Assistant (Build · claude-opus-4-5 · 18.1s)

Now let me create a template `WORKFLOW.md` file that the agents will use to communicate:

**Tool: write**

**Input:**
```json
{
  "filePath": "/home/david/Projects/akasharender/akasharender/.opencode/agents/WORKFLOW-TEMPLATE.md",
  "content": "# Workflow State\n\nThis file tracks the state of the current development task across agent handoffs.\nCopy this template to `WORKFLOW.md` in the project root when starting new work.\n\n## Task Description\n<!-- Brief description of what needs to be built -->\n\n## Requirements\n<!-- Checkbox list of requirements with acceptance criteria -->\n- [ ] Requirement 1: Description with acceptance criteria\n- [ ] Requirement 2: Description with acceptance criteria\n\n## Current Phase\n<!-- One of: REQUIREMENTS | BUILDING | CODE_REVIEW | QA | PM_VALIDATION | COMPLETE -->\nREQUIREMENTS\n\n## Next Agent\n<!-- One of: program-manager | builder | code-reviewer | quality-assurance | none -->\nprogram-manager\n\n## Agent History\n<!-- Log of agent handoffs -->\n| Timestamp | From Agent | To Agent | Status |\n|-----------|------------|----------|--------|\n| | | program-manager | Started |\n\n## Handoff Notes\n<!-- Notes from the current/previous agent for the next agent -->\n\n### From Program Manager\n<!-- Requirements clarifications, scope notes -->\n\n### From Builder  \n<!-- Implementation decisions, files changed, technical notes -->\n\n### From Code Reviewer\n<!-- Review findings, issues to address, approved items -->\n\n### From Quality Assurance\n<!-- Test results, coverage notes, bugs found -->\n\n## Files Changed\n<!-- List of files modified or created during this workflow -->\n\n## Validation Results\n<!-- PM's final validation notes -->\n\n---\n\n## Workflow Process\n\n```\n                    +------------------+\n                    | Program Manager  |\n                    | (Requirements)   |\n                    +--------+---------+\n                             |\n                             v\n                    +--------+---------+\n                    |     Builder      |\n                    | (Implementation) |\n                    +--------+---------+\n                             |\n                     +-------+-------+\n                     |               |\n                     v               |\n            +--------+--------+      |\n            |  Code Reviewer  |      |\n            | (Quality Check) |      |\n            +--------+--------+      |\n                     |               |\n              +------+------+        |\n              |             |        |\n         APPROVED      NEEDS_REVISION\n              |             |        |\n              v             +--------+\n     +--------+--------+\n     | Quality Assurance|\n     |    (Testing)    |\n     +--------+--------+\n              |\n       +------+------+\n       |             |\n    PASSED        FAILED\n       |             |\n       v             +---> Builder\n+------+-------+\n|Program Manager|\n| (Validation) |\n+------+-------+\n       |\n+------+------+\n|             |\nMET        NOT_MET\n|             |\nv             +---> Builder\nCOMPLETE\n```\n\n## Usage\n\n1. **Starting Work**: Program Manager creates WORKFLOW.md with requirements\n2. **Building**: Builder implements, updates handoff notes, routes to Code Reviewer\n3. **Review**: Code Reviewer validates, routes to QA or back to Builder\n4. **Testing**: QA writes tests, runs them, routes to PM or back to Builder\n5. **Validation**: PM verifies requirements met, marks complete or returns to Builder\n"
}
```

**Output:**
```
Wrote file successfully.
```

---

## Assistant (Build · claude-opus-4-5 · 9.6s)

Now let me create a command that helps orchestrate the workflow:

**Tool: write**

**Input:**
```json
{
  "filePath": "/home/david/Projects/akasharender/akasharender/.opencode/command/workflow.md",
  "content": "---\ndescription: Start or continue the multi-agent development workflow\nagent: program-manager\n---\n\n# Multi-Agent Development Workflow\n\nThis command initiates or continues the collaborative development workflow involving four specialized agents:\n\n1. **Program Manager** - Requirements and validation\n2. **Builder** - Implementation\n3. **Code Reviewer** - Quality and architecture checks  \n4. **Quality Assurance** - Testing\n\n## Starting New Work\n\nIf no `WORKFLOW.md` exists in the project root, create one using the template at `.opencode/agents/WORKFLOW-TEMPLATE.md`.\n\n## Continuing Work\n\nIf `WORKFLOW.md` exists:\n1. Read it to understand current state\n2. Check the \"Next Agent\" field to determine who should work\n3. Continue from current phase\n\n## Agent Handoff Protocol\n\nEach agent must:\n1. Read `WORKFLOW.md` at start\n2. Update `WORKFLOW.md` before finishing\n3. Set \"Next Agent\" appropriately\n4. Add detailed handoff notes\n\n## Workflow Command\n\nTo invoke a specific agent:\n- `@program-manager` - Define requirements or validate completion\n- `@builder` - Implement code\n- `@code-reviewer` - Review code quality\n- `@quality-assurance` - Write and run tests\n"
}
```

**Output:**
```
Wrote file successfully.
```

---

## Assistant (Build · claude-opus-4-5 · 3.1s)

Let me verify all the files were created correctly:

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/david/Projects/akasharender/akasharender/.opencode"
}
```

**Output:**
```
<path>/home/david/Projects/akasharender/akasharender/.opencode</path>
<type>directory</type>
<entries>
.gitignore
agents/
bun.lock
command/
node_modules/
package.json

(6 entries)
</entries>
```

---

## Assistant (Build · claude-opus-4-5 · 3.8s)

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/david/Projects/akasharender/akasharender/.opencode/agents"
}
```

**Output:**
```
<path>/home/david/Projects/akasharender/akasharender/.opencode/agents</path>
<type>directory</type>
<entries>
builder.md
code-reviewer.md
program-manager.md
quality-assurance.md
WORKFLOW-TEMPLATE.md

(5 entries)
</entries>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/david/Projects/akasharender/akasharender/.opencode/command"
}
```

**Output:**
```
<path>/home/david/Projects/akasharender/akasharender/.opencode/command</path>
<type>directory</type>
<entries>
build.md
test.md
workflow.md

(3 entries)
</entries>
```

---

## Assistant (Build · claude-opus-4-5 · 13.9s)

All files are created. Here's a summary of what I've implemented:

## Multi-Agent Development System for OpenCode

I've created a four-agent collaborative system in `.opencode/agents/`:

### Agents Created

| Agent | File | Role |
|-------|------|------|
| **Program Manager** | `program-manager.md` | Requirements, coordination, final validation |
| **Builder** | `builder.md` | Code implementation |
| **Code Reviewer** | `code-reviewer.md` | Quality/architecture checks |
| **Quality Assurance** | `quality-assurance.md` | Test writing and execution |

### Key Design Decisions

1. **Context Isolation**: Each agent runs with fresh context (OpenCode's default behavior). They communicate via `WORKFLOW.md` in the project root.

2. **State Management**: The `WORKFLOW.md` file tracks:
   - Requirements with acceptance criteria
   - Current phase (REQUIREMENTS, BUILDING, CODE_REVIEW, QA, PM_VALIDATION, COMPLETE)
   - Next agent to invoke
   - Handoff notes from each agent
   - Files changed
   - Validation results

3. **Workflow Loop**:
   ```
   PM (requirements) -> Builder -> Code Reviewer -> QA -> PM (validation)
                           ^            |           |          |
                           |            v           v          v
                           +---- NEEDS_REVISION ----+----------+
   ```

4. **Tool Restrictions**:
   - PM: Read-only + Write (for WORKFLOW.md only)
   - Builder: Full code editing + Bash (for builds)
   - Code Reviewer: Read-only (doesn't modify code)
   - QA: Full access (writes tests + runs them)

### How to Use

1. **Start new work**: Invoke `@program-manager` with your task description
2. **Continue work**: Check `WORKFLOW.md` for "Next Agent", then invoke that agent
3. **Use the command**: `/workflow` starts with Program Manager

### Example Usage

```
# Start new work
@program-manager Add a function to validate configuration options

# After PM defines requirements, invoke Builder
@builder

# After Builder implements, invoke Code Reviewer  
@code-reviewer

# After review passes, invoke QA
@quality-assurance

# After tests pass, PM validates
@program-manager
```

### Files Created

- `.opencode/agents/program-manager.md`
- `.opencode/agents/builder.md`
- `.opencode/agents/code-reviewer.md`
- `.opencode/agents/quality-assurance.md`
- `.opencode/agents/WORKFLOW-TEMPLATE.md` (template for new workflows)
- `.opencode/command/workflow.md` (command to start workflow)

---

## User

This looks good.  However, there is an existing project plan in FEATURE-Tag-Wrangling.md with a list of steps already laid out.  How do I tell the program-manager to check and understand this file, and how to I ask the program-manager to launch the project described in this file?

---

## Assistant (Build · claude-opus-4-5 · 4.7s)

Great question! Let me look at the feature plan file to understand its structure, then I'll show you how to instruct Program Manager to use it.

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/david/Projects/akasharender/akasharender/FEATURE-Tag-Wrangling.md"
}
```

**Output:**
```
<path>/home/david/Projects/akasharender/akasharender/FEATURE-Tag-Wrangling.md</path>
<type>file</type>
<content>1: A site developer will want a better view of the tags in use on the site, and ability to manage the tags.
2: 
3: Recall that document tags are defined in the frontmatter of each document.  A frontmatter field, `tags`, holds an array of tag names.  There is no central registry of tag names.
4: 
5: A tag definition is this object:
6: 
7: ```typescript
8: {
9: 	tagName: string,
10: 	description: string
11: }
12: ```
13: 
14: I don't remember if this object is formally defined anywhere.  In `index.ts`, in the `Configuration` class, there is an internal array where this is defined:
15: 
16: ```typescript
17: #descriptions: Array<{
18: 	tagName: string,
19: 	description: string
20: }>;
21: ```
22: 
23: The configuration file might call the `addTagDescriptions` function to provide descriptions for some tags.
24: 
25: The `description` field is primarily used by the `@akashacms/plugins-tagged-content` plugin when it generates tag index pages.  The description is meant to appear at the top of the tag index page.
26: 
27: The `addTagDescriptions` function probably has a bug in that it simply assigns the tag descriptions to the internal array.  The bug is what if there are existing tag descriptions?  Shouldn't it instead merge the new descriptions into the array rather than blowing away the array?  The assumption is this function will be called only one time, from the configuration file, and this problem scenario will not happen.
28: 
29: The existing internal API for tags and tag management is in `cache/tag-glue.ts`.  A table is defined, `TAGGLUE`, where the schema is:
30: 
31: ```sql
32: CREATE TABLE IF NOT EXISTS
33: TAGGLUE (
34:   docvpath STRING,
35:   tagName STRING
36: );
37: ```
38: 
39: That is, it maps the `vpath` of a document with a `tagName`.
40: 
41: Getting the list of all tags is:
42: 
43: ```sql
44: SELECT DISTINCT tagName AS tag
45: FROM TAGGLUE;
46: ```
47: Or, the list of documents which use a given tag is:
48: 
49: ```sql
50: SELECT DISTINCT docvpath AS vpath
51: FROM TAGGLUE
52: WHERE tagName = $tag;
53: ```
54: In `cli.ts` the commands related to tags are:
55: 
56: - `tags` -- Retrieves the list of all tags
57: - `docs-with-tag` -- Retrieves the list of documents with a given tag
58: - `search` -- takes an option allowing one to select by tag name
59: 
60: # Requested new functionality
61: 
62: - Finding similar tag names - to detect excess tag names
63: - Refactoring tag names, meaning to change all uses of a given tag to another tag
64: - Finding tags that have no description
65: - Finding unused tags. 
66: 
67: These should be
68: 
69: - API functions
70: - Commands in `cli.ts`
71: 
72: The output format from `cli.ts` should be YAML formatted for easy reading.
73: 
74: _Finding similar tags_ should consider:
75: 
76: - Case insensitive matching
77: - Plural/singular variants -- using `pluralize`
78: - Common typos
79: - Levenshtein Distance -- using `fastest-levenshtein`
80: 
81: _Refactoring tag names_ means:
82: 
83: - There are two tag names - *old* and *new* - where the task is to change all instances of the old tag name to the new tag name.  The old tag name should no longer exist after the refactoring.  For any documents that already had the new tag name, there is no need to add the new tag name again because it is already in the file.
84: - Modifying the front-matter in the documents.
85: - Akasharender is not involved with version control of documents, that's up to the author of the site
86: - There should be a dry-run mode, where it lists the changes that would be made rather than performing the changes
87: 
88: _Tags without descriptions_ -- Just list those tag names, along with the files where the tag name is used.  However, the site author will be adding descriptions into the configuration file.
89: 
90: _Finding unused tags_ -- One possible way this condition occurs is when a tag is listed in the configuration file, but no document uses that tag.  The result should simply be to list these tags.
91: # Main tasks
92: 
93: ## 1. Add dependencies
94: 
95: Add to `package.json`:
96: - `fastest-levenshtein` - for computing edit distance between tag names
97: - `pluralize` - for detecting singular/plural variants
98: 
99: ## 2. Create type definitions
100: 
101: DONE: Created `lib/types.ts` with:
102: - `TagDescription` interface
103: - `validTagDescription()` validation function
104: - `SimilarTagGroup` interface for grouping similar tags
105: - `SimilarityReason` type
106: - `TagWithoutDescription` interface
107: - `RefactorTagResult` and related interfaces
108: 
109: ## 3. Create API functions in `lib/cache/tag-glue.ts`
110: 
111: Add the following methods to the `TagGlue` class:
112: 
113: ### `findSimilarTags(threshold?: number): Promise<SimilarTagGroup[]>`
114: 
115: Returns groups of tags that are similar to each other. Similarity is determined by:
116: 1. Case-insensitive exact matches (e.g., `JavaScript` and `javascript`)
117: 2. Plural/singular variants using `pluralize` (e.g., `tag` and `tags`)
118: 3. Levenshtein distance ≤ threshold (default 2)
119: 
120: Returns an array of `SimilarTagGroup` objects. Each group contains:
121: - `tags`: Array of similar tag names
122: - `reasons`: Why they are similar (case-insensitive, plural-singular, levenshtein)
123: - `documentsByTag`: Map of tag name to array of document vpaths using that tag
124: 
125: ### `tagsWithoutDescriptions(): Promise<TagWithoutDescription[]>`
126: 
127: Queries TAGGLUE for all tags, then checks TAGDESCRIPTION for each. Returns tags that have no entry in TAGDESCRIPTION, along with the list of document vpaths using each tag.
128: 
129: ### `unusedTagDescriptions(): Promise<string[]>`
130: 
131: Queries TAGDESCRIPTION for all defined tags, then checks TAGGLUE. Returns tag names that have descriptions but are not used by any document.
132: 
133: ## 4. Create SQL files
134: 
135: Add to `lib/cache/sql/`:
136: - `select-all-tags-with-docs.sql` - Get all tags with their document vpaths
137: - `select-tags-without-descriptions.sql` - LEFT JOIN to find tags missing descriptions
138: - `select-unused-descriptions.sql` - Find descriptions with no matching tags in TAGGLUE
139: 
140: ## 5. Create refactoring function in `lib/refactor-tags.ts`
141: 
142: ### `refactorTag(config, oldTag: string, newTag: string, options: { dryRun: boolean }): Promise<RefactorTagResult>`
143: 
144: 1. Query TAGGLUE for all documents with `oldTag`
145: 2. For each document:
146:    - Read the file from disk using the document's `fspath`
147:    - Parse the frontmatter
148:    - If document already has `newTag`, just remove `oldTag` from the tags array
149:    - Otherwise, replace `oldTag` with `newTag` in the tags array
150:    - If `dryRun` is false, write the modified frontmatter back to the file
151: 3. Return a `RefactorTagResult` object listing all changes made (or that would be made)
152: 
153: Note: This function modifies source files on disk, not the database. The database will reflect the changes on the next `akasha.setup()` call.
154: 
155: ## 6. Add CLI commands in `lib/cli.ts`
156: 
157: ### `similar-tags <configFN>`
158: Options: `--threshold <n>` (default: 2)
159: 
160: Calls `findSimilarTags()` and outputs results in YAML format.
161: 
162: ### `tags-without-descriptions <configFN>`
163: 
164: Calls `tagsWithoutDescriptions()` and outputs results in YAML format.
165: 
166: ### `unused-tag-descriptions <configFN>`
167: 
168: Calls `unusedTagDescriptions()` and outputs results in YAML format.
169: 
170: ### `refactor-tag <configFN> <oldTag> <newTag>`
171: Options: `--dry-run` (default: false)
172: 
173: Calls `refactorTag()` and outputs results in YAML format showing files modified (or that would be modified).
174: 
175: ## 7. Update existing `tags` command
176: 
177: Modify the existing `tags` command in `cli.ts` to output YAML format for consistency with the new commands.
178: 
179: ## 8. Add comment about potential bug in `addTagDescriptions`
180: 
181: In `lib/index.ts`, add a comment at line 1062 noting that the current implementation replaces the array rather than merging, which could lose descriptions if called multiple times. This is deferred for future fix.
182: 
183: ## 9. Refactor existing code to use TagDescription type
184: 
185: Update `lib/index.ts` to import and use the `TagDescription` type from `lib/types.ts` instead of inline type definitions. This includes the `#descriptions` array and the `addTagDescriptions()` method parameter.
186: 
187: ## 10. Document the tags implementation
188: 
189: Create `IMPLEMENTATION-tags.md` discussing all aspects of document tags in AkashaRender.
190: 
191: This must also include documenting the `@akashacms/plugins-tagged-content` plugin. Its implementation is in the https://github.com/akashacms/akashacms-tagged-content repository. That repository is checked out on disk in the `/home/david/Projects/akasharender/akashacms-tagged-content` directory.
192: 
193: # Backlog tasks
194: 
195: **~~Add formal type description for a tag with description~~**: DONE - Created `lib/types.ts` with `TagDescription` interface and `validTagDescription()` function. 
196: 
197: # Plan
198: 
199: ## Phase 1: Setup
200: 
201: 1. Add `fastest-levenshtein` and `pluralize` to `package.json` dependencies
202: 2. ~~Create `lib/types.ts` with type definitions~~ DONE
203: 
204: ## Phase 2: API Implementation
205: 
206: 3. Create SQL files in `lib/cache/sql/`:
207:    - `select-all-tags-with-docs.sql`
208:    - `select-tags-without-descriptions.sql`
209:    - `select-unused-descriptions.sql`
210: 
211: 4. Implement `findSimilarTags()` in `TagGlue` class (`lib/cache/tag-glue.ts`)
212:    - Load SQL file
213:    - Fetch all tags with documents
214:    - Compare tags for similarity (case, plural/singular, Levenshtein)
215:    - Group similar tags together
216:    
217: 5. Implement `tagsWithoutDescriptions()` in `TagGlue` class
218:    - Load SQL file
219:    - Return tags missing from TAGDESCRIPTION table
220:    
221: 6. Implement `unusedTagDescriptions()` in `TagDescriptions` class
222:    - Load SQL file  
223:    - Return descriptions with no matching tags
224: 
225: 7. Create `lib/refactor-tags.ts` with `refactorTag()` function
226:    - Handle frontmatter parsing and modification
227:    - Implement dry-run mode
228:    - Return structured result
229: 
230: ## Phase 3: CLI Commands
231: 
232: 8. Add `similar-tags` command to `lib/cli.ts`
233: 9. Add `tags-without-descriptions` command to `lib/cli.ts`
234: 10. Add `unused-tag-descriptions` command to `lib/cli.ts`
235: 11. Add `refactor-tag` command to `lib/cli.ts`
236: 12. Update existing `tags` command to output YAML format
237: 
238: ## Phase 4: Documentation and Cleanup
239: 
240: 13. Add comment about potential bug in `addTagDescriptions` (line 1062 of `lib/index.ts`)
241: 14. Refactor `lib/index.ts` to use `TagDescription` type from `lib/types.ts`
242: 15. Create `IMPLEMENTATION-tags.md` documenting the tags implementation
243: 
244: ## Testing
245: 
246: Tests follow the project pattern: test API functions directly rather than CLI commands. Tests are written in Mocha with Chai assertions, using ES modules (`.mjs` files).
247: 
248: ### Test file location
249: 
250: Add a new `describe` block in `test/test-cache.mjs` within the existing `tags` describe block (around line 1001), or create a new describe block for "tag wrangling" after the existing tags tests.
251: 
252: ### Test fixtures needed
253: 
254: Add new document files to `test/documents/` to create conditions for similarity detection:
255: 
256: - `tags-similar-case.html.md` - with tags like `javascript`, `JavaScript` (case variants)
257: - `tags-similar-plural.html.md` - with tags like `tag`, `tags` (plural/singular)
258: - `tags-similar-typo.html.md` - with tags like `JavaScipt` (typo, Levenshtein distance 1)
259: 
260: Update the `addTagDescriptions` call in the test configuration (around line 23 of `test-cache.mjs`) to include:
261: - A description for a tag that no document uses (to test `unusedTagDescriptions`)
262: - Leave some tags without descriptions (already the case for Tag2, Tag3, etc.)
263: 
264: ### Tests for `findSimilarTags()`
265: 
266: - Should return empty array when no similar tags exist
267: - Should group case-insensitive matches (e.g., `javascript` and `JavaScript`)
268: - Should group plural/singular variants (e.g., `tag` and `tags`)
269: - Should group tags within Levenshtein threshold
270: - Should include correct documents for each tag in the group
271: - Should respect custom threshold parameter
272: 
273: ### Tests for `tagsWithoutDescriptions()`
274: 
275: - Should return tags that have no entry in TAGDESCRIPTION
276: - Should include document vpaths for each tag
277: - Should return empty array when all tags have descriptions
278: 
279: ### Tests for `unusedTagDescriptions()`
280: 
281: - Should return tag names that have descriptions but no documents
282: - Should return empty array when all described tags are used
283: 
284: ### Tests for `refactorTag()`
285: 
286: For refactor testing, use a dedicated test documents directory or create temporary files to avoid modifying the main test fixtures.
287: 
288: - Should identify all documents with the old tag (dry-run mode)
289: - Should correctly replace old tag with new tag in frontmatter
290: - Should handle case where document already has the new tag (merge case)
291: - Should preserve other frontmatter fields unchanged
292: - Should return accurate counts in result object
293: - Should not modify files in dry-run mode
294: 

(End of file - total 294 lines)
</content>
```

---

## Assistant (Build · claude-opus-4-5 · 16.7s)

This is a well-structured feature plan. Now I'll update the Program Manager agent to understand how to work with feature plan files, and show you how to launch this project.

**Tool: edit**

**Input:**
```json
{
  "filePath": "/home/david/Projects/akasharender/akasharender/.opencode/agents/program-manager.md",
  "oldString": "## Your Responsibilities\n\n1. **Requirements Definition**: Gather, clarify, and document complete requirements\n2. **Workflow Coordination**: Manage handoffs between Builder, Code Reviewer, and Quality Assurance\n3. **Delivery Validation**: Verify that completed work meets all stated requirements\n4. **Gap Analysis**: Identify missing requirements, edge cases, or unclear specifications",
  "newString": "## Your Responsibilities\n\n1. **Requirements Definition**: Gather, clarify, and document complete requirements\n2. **Feature Plan Adoption**: Read and understand existing feature plans (e.g., `FEATURE-*.md` files)\n3. **Workflow Coordination**: Manage handoffs between Builder, Code Reviewer, and Quality Assurance\n4. **Delivery Validation**: Verify that completed work meets all stated requirements\n5. **Gap Analysis**: Identify missing requirements, edge cases, or unclear specifications\n\n## Working with Feature Plans\n\nWhen a user references a feature plan file (e.g., `FEATURE-Tag-Wrangling.md`):\n\n1. **Read the entire file** to understand:\n   - The problem being solved\n   - Background context and existing implementation\n   - Requested functionality\n   - Main tasks with detailed specifications\n   - The phased plan\n   - Testing requirements\n\n2. **Extract requirements** from the plan:\n   - Convert main tasks into discrete, testable requirements\n   - Note dependencies between tasks\n   - Identify which phase to start with\n\n3. **Create WORKFLOW.md** with:\n   - Reference to the source feature plan file\n   - Current phase/task being worked on\n   - Extracted requirements for that phase\n   - Acceptance criteria derived from the plan\n\n4. **Incremental Delivery**: Work through the plan phase by phase:\n   - Complete Phase 1 fully before moving to Phase 2\n   - Each phase goes through the full agent workflow (Build -> Review -> QA -> PM Validation)\n   - Mark completed tasks in the feature plan file with checkboxes or \"DONE\" annotations"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Build · claude-opus-4-5 · 8.0s)

**Tool: edit**

**Input:**
```json
{
  "filePath": "/home/david/Projects/akasharender/akasharender/.opencode/agents/program-manager.md",
  "oldString": "### WORKFLOW.md Structure\n```markdown\n# Workflow State\n\n## Requirements\n- [ ] Requirement 1: description\n- [ ] Requirement 2: description\n\n## Current Phase\n[REQUIREMENTS | BUILDING | CODE_REVIEW | QA | PM_VALIDATION | COMPLETE]\n\n## Next Agent\n[program-manager | builder | code-reviewer | quality-assurance]\n\n## Handoff Notes\nNotes from previous agent...\n\n## Validation Results\nPM validation notes...\n```",
  "newString": "### WORKFLOW.md Structure\n```markdown\n# Workflow State\n\n## Source Feature Plan\n[Path to feature plan file, if applicable]\n\n## Current Phase/Task\n[Which phase and specific task from the feature plan]\n\n## Requirements for Current Task\n- [ ] Requirement 1: description with acceptance criteria\n- [ ] Requirement 2: description with acceptance criteria\n\n## Workflow Phase\n[REQUIREMENTS | BUILDING | CODE_REVIEW | QA | PM_VALIDATION | PHASE_COMPLETE]\n\n## Next Agent\n[program-manager | builder | code-reviewer | quality-assurance]\n\n## Handoff Notes\nNotes from previous agent...\n\n## Validation Results\nPM validation notes...\n\n## Completed Tasks\n- [x] Task that was completed\n```"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Build · claude-opus-4-5 · 9.5s)

**Tool: edit**

**Input:**
```json
{
  "filePath": "/home/david/Projects/akasharender/akasharender/.opencode/agents/program-manager.md",
  "oldString": "### When Starting New Work\n1. Read existing `WORKFLOW.md` if present\n2. Gather requirements from user or existing documentation\n3. Document requirements with clear acceptance criteria\n4. Create/update `WORKFLOW.md` with requirements\n5. Set `Next Agent: builder` and `Current Phase: BUILDING`\n6. Provide clear summary for Builder handoff",
  "newString": "### When Starting New Work\n1. Read existing `WORKFLOW.md` if present\n2. If user references a feature plan file (e.g., `FEATURE-*.md`):\n   - Read the entire feature plan file\n   - Understand the full scope and all phases\n   - Identify the first incomplete phase/task to work on\n3. Gather requirements from user, feature plan, or existing documentation\n4. Document requirements with clear acceptance criteria\n5. Create/update `WORKFLOW.md` with:\n   - Reference to source feature plan (if applicable)\n   - Current phase/task being worked on\n   - Specific requirements for this iteration\n6. Set `Next Agent: builder` and `Workflow Phase: BUILDING`\n7. Provide clear summary for Builder handoff\n\n### When Starting from a Feature Plan\n1. Read the entire feature plan file\n2. Check which tasks are marked DONE vs still pending\n3. Select the next incomplete task (respecting dependencies)\n4. Extract specific requirements for that task only\n5. Create `WORKFLOW.md` scoped to that task\n6. After task completion, return to the feature plan for the next task"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Build · claude-opus-4-5 · 9.4s)

Now let me update the WORKFLOW-TEMPLATE.md to include feature plan support:

**Tool: edit**

**Input:**
```json
{
  "filePath": "/home/david/Projects/akasharender/akasharender/.opencode/agents/WORKFLOW-TEMPLATE.md",
  "oldString": "# Workflow State\n\nThis file tracks the state of the current development task across agent handoffs.\nCopy this template to `WORKFLOW.md` in the project root when starting new work.\n\n## Task Description\n<!-- Brief description of what needs to be built -->\n\n## Requirements\n<!-- Checkbox list of requirements with acceptance criteria -->\n- [ ] Requirement 1: Description with acceptance criteria\n- [ ] Requirement 2: Description with acceptance criteria\n\n## Current Phase\n<!-- One of: REQUIREMENTS | BUILDING | CODE_REVIEW | QA | PM_VALIDATION | COMPLETE -->\nREQUIREMENTS\n\n## Next Agent\n<!-- One of: program-manager | builder | code-reviewer | quality-assurance | none -->\nprogram-manager",
  "newString": "# Workflow State\n\nThis file tracks the state of the current development task across agent handoffs.\nCopy this template to `WORKFLOW.md` in the project root when starting new work.\n\n## Source Feature Plan\n<!-- Path to feature plan file if working from an existing plan, or \"N/A\" -->\nN/A\n\n## Current Phase/Task\n<!-- Which phase and specific task from the feature plan, or general description -->\nInitial setup\n\n## Task Description\n<!-- Brief description of what needs to be built in this iteration -->\n\n## Requirements for This Iteration\n<!-- Checkbox list of requirements with acceptance criteria - scoped to current task only -->\n- [ ] Requirement 1: Description with acceptance criteria\n- [ ] Requirement 2: Description with acceptance criteria\n\n## Workflow Phase\n<!-- One of: REQUIREMENTS | BUILDING | CODE_REVIEW | QA | PM_VALIDATION | PHASE_COMPLETE -->\nREQUIREMENTS\n\n## Next Agent\n<!-- One of: program-manager | builder | code-reviewer | quality-assurance | none -->\nprogram-manager\n\n## Completed Tasks\n<!-- Tasks from the feature plan that have been completed -->\n- None yet"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Build · claude-opus-4-5 · 13.5s)

Now let me create a specific command to launch work from a feature plan:

**Tool: write**

**Input:**
```json
{
  "filePath": "/home/david/Projects/akasharender/akasharender/.opencode/command/feature-plan.md",
  "content": "---\ndescription: Start or continue work from a feature plan file\nagent: program-manager\n---\n\n# Feature Plan Workflow\n\nThis command initiates work from an existing feature plan file (e.g., `FEATURE-*.md`).\n\n## Usage\n\nProvide the path to the feature plan file:\n\n```\n/feature-plan FEATURE-Tag-Wrangling.md\n```\n\nOr reference it with @:\n\n```\n@program-manager Please start working on @FEATURE-Tag-Wrangling.md\n```\n\n## What Program Manager Will Do\n\n1. **Read the feature plan** completely to understand:\n   - Problem context and background\n   - Requested functionality\n   - Main tasks with specifications\n   - Phased plan\n   - Testing requirements\n\n2. **Identify current state**:\n   - Which tasks are marked DONE\n   - Which phase to start/continue\n   - Dependencies between tasks\n\n3. **Create WORKFLOW.md** with:\n   - Reference to the source feature plan\n   - Current phase/task being worked on\n   - Specific requirements for this iteration\n   - Acceptance criteria derived from the plan\n\n4. **Hand off to Builder** for implementation\n\n## Incremental Delivery\n\nThe agents work through the plan phase by phase:\n- Phase 1 completes fully before Phase 2 starts\n- Each task goes through: Build -> Code Review -> QA -> PM Validation\n- Completed tasks get marked in the feature plan\n\n## Example Feature Plan Structure\n\n```markdown\n# Feature Name\n\n## Background\nContext about the problem...\n\n## Requested Functionality\n- Feature A\n- Feature B\n\n## Main Tasks\n\n### 1. First Task\nDONE: Description of completed work\n\n### 2. Second Task\nDetails of what needs to be built...\n\n## Plan\n\n### Phase 1: Setup\n1. Task 1.1\n2. Task 1.2\n\n### Phase 2: Implementation\n3. Task 2.1\n...\n```\n\n## Continuing Work\n\nIf `WORKFLOW.md` exists and references a feature plan:\n1. Program Manager reads both files\n2. Validates current task completion\n3. Moves to next task in the plan\n4. Updates `WORKFLOW.md` for the new task\n"
}
```

**Output:**
```
Wrote file successfully.
```

---

## Assistant (Build · claude-opus-4-5 · 12.9s)

Now here's how you can launch the Tag Wrangling project:

## How to Launch the Tag Wrangling Feature

You have several options:

### Option 1: Use the Feature Plan Command
```
/feature-plan FEATURE-Tag-Wrangling.md
```

### Option 2: Direct Invocation with @ Reference
```
@program-manager Please read and start implementing the feature plan in @FEATURE-Tag-Wrangling.md. Begin with Phase 1 (Setup) since lib/types.ts is already marked DONE.
```

### Option 3: More Detailed Prompt
```
@program-manager 

Read the feature plan at FEATURE-Tag-Wrangling.md and start the multi-agent workflow.

The feature plan describes tag wrangling functionality for AkashaRender. Note that:
- lib/types.ts is already completed (marked DONE)
- Phase 1 item 1 (add dependencies) is still pending
- Start with Phase 1, then proceed through the phases

Create WORKFLOW.md to track progress and hand off to Builder.
```

## What Will Happen

1. **Program Manager** will:
   - Read `FEATURE-Tag-Wrangling.md` completely
   - Note that `lib/types.ts` is marked DONE
   - Extract requirements for the next task (adding dependencies to package.json)
   - Create `WORKFLOW.md` with scoped requirements
   - Hand off to Builder

2. **Builder** will:
   - Read `WORKFLOW.md` for requirements
   - Implement the task (e.g., add dependencies)
   - Run `npm run build` to verify
   - Hand off to Code Reviewer

3. **Code Reviewer** will:
   - Review the changes
   - Route to QA or back to Builder

4. **Quality Assurance** will:
   - Write tests if applicable
   - Run tests
   - Route to PM or back to Builder

5. **Program Manager** will:
   - Validate the task is complete
   - Update the feature plan file (mark task DONE)
   - Start the next task or mark phase complete

## Files Updated

- `.opencode/agents/program-manager.md` - Added feature plan support
- `.opencode/agents/WORKFLOW-TEMPLATE.md` - Added feature plan fields
- `.opencode/command/feature-plan.md` - New command for feature plan workflows

---

## User

Please add appropriate instructions to AGENTS.md going over how to use this process

---

## Assistant (Build · claude-opus-4-5 · 4.2s)

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/david/Projects/akasharender/akasharender/AGENTS.md"
}
```

**Output:**
```
<path>/home/david/Projects/akasharender/akasharender/AGENTS.md</path>
<type>file</type>
<content>1: # AkashaRender Agent Guidelines
2: 
3: AkashaRender is the core component of a system called AkashaCMS.  AkashaCMS refers to the full set of AkashaCMS modules, which are spread out over multiple repositories within the GitHub organization: https://github.com/akashacms/
4: 
5: The scope for AkashaCMS is rendering static HTML websites, rendering EPUB books from the same content, and generating good looking PDF documents from the same content.  In other words, the goal is using the same content files for websites, PDF documents, and/or EPUB books.
6: 
7: ## Build Commands
8: - `npm run build` - Compile TypeScript to JavaScript
9: - `npm run watch` - Watch mode compilation
10: - `cd test && npm test` - Run full test suite
11: - `cd test && npm run test-normal` - Run main tests (mocha ./index.mjs)
12: - `cd test && npm run test-cache` - Run cache tests
13: - `cd test && npm run test-rebased` - Run rebased tests
14: 
15: ## Code Style
16: - **Language**: TypeScript with ES2021 target, NodeNext modules
17: - **Imports**: Use ES6 imports (`import ... from '...'`), Node.js built-ins with `node:` prefix
18: - **Types**: Explicit TypeScript types, use `any` sparingly with proper typing
19: - **Classes**: Private fields with `#` syntax, proper encapsulation
20: - **Error Handling**: Throw descriptive Error objects with context
21: - **Async**: Use async/await, avoid callbacks
22: - **Comments**: Apache 2.0 license headers, JSDoc for public APIs, minimal inline comments
23: - **Naming**: camelCase for variables/functions, PascalCase for classes/types
24: - **File Structure**: Source in `lib/`, compiled output in `dist/`, tests in `test/`
25: - **SQL**: SQL commands are mostly kept in `sql/` subdirectories, with a file name having a `.sql` extension. These files are dynamically read from disk into an in-memory variable.  In some cases the table name is dynamically selected, and inserted using `SqlString.format`.
26: 
27: ## Architecture
28: - Main entry: `lib/index.ts` exports Configuration class and utilities
29: - Plugin system: Extend `Plugin` class from `lib/Plugin.ts`
30: - Rendering: Uses `@akashacms/renderers` for template processing
31: - Server-side DOM Manipulation: After rendering to HTML, Mahabhuta (`mahabhuta`) is used to drive DOM manipulation using functions defined in the plugins.
32: - Stacked Directories: Four kinds of directories are defined: assets, partials, layouts, and documents.  For each type, multiple directories can be stacked on top of one another in a virtual filesystem.  A key principle is the ability to override a file, such as a partial template, by mounting a directory on the corresponding directory stack, and adding a file of the same name to that directory.  This is implemented by the VFStack class in `lib/cache/vfstack.ts`.
33: - Caching: SQLite-based file caching in `lib/cache/`.  The file information is gathered by the VFStack scanning process during initialization.
34: - In-Memory SQLITE3 database: A lot of data is kept in this database, allowing for ease of accessing the data in any desired fashion.
35: - Database request caching: Some database queries are repeated multiple times, and a cache is used to hold such data to prevent excess queries for the same data.
36: - Testing: Mocha with Chai assertions, ES modules (.mjs files)
37: 
38: ## Configuring an AkashaCMS project
39: 
40: The sibling directories ../akashacms-blog-skeleton, ../akashacms-example, ../akashacms-skeleton, ../akashacms-website, ../open-source-site, and ../pdf-document-construction-set/guide all contain examples of an AkashaCMS project which renders to a website.
41: 
42: The key features of a project directory are:
43: 
44: 1. `package.json` containing dependencies to packages required by the project, as well as scripts used for building, previewing, or deploying the website
45: 2. `config.mjs` containing configuration declarations, in JavaScript, for the project
46: 
47: In the configuration, one lists:
48: 
49: * the required plugins, their configuration.  A plugin is added using the `use` function.
50: * the directories in which to find assets, partial templates, layout templates, and documents.  This is done with `addAssetsDir`, `.addPartialsDir`, `addLayoutsDir`, and `addDocumentsDir` function calls.
51: * possible configuration for Markdown-IT, such as plugins from its ecosystem -- such configuration is accessed with `config.findRendererName('.html.md')`
52: * adding JavaScript references for the top of the document (using `addHeaderJavaScript`) or the bottom of the document (using `addFooterJavaScript`)
53: * Adding CSS stylesheet references (using `addStylesheet`)
54: 
55: The `config.prepare` function prepares the configuration for use.
56: 
57: The `export default config` declaration makes it available for use by AkashaRender.
58: 
59: ## Rendering an AkashaCMS project into a website
60: 
61: With the configuration of an AkashaCMS project directory, and with the creation of files related to the project, one runs the command:
62: 
63: ```shell
64: npx akasharender render config.mjs
65: ```
66: 
67: The file `lib/cli.mjs` serves as an example of invoking various API methods in AkashaRender.  The `render` command is useful to see how the configuration object and other parts of the system work together.
68: 
69: It starts with importing the configuration:
70: 
71: ```js
72: const config = (await import(
73:     path.join(process.cwd(), configFN)
74: )).default;
75: ```
76: 
77: It's used this way because the pathname for the configuration is not known at compile time, but at execution time.
78: 
79: Next:
80: 
81: ```js
82: let akasha = config.akasha;
83: await akasha.setup(config);
84: await data.removeAll();
85: if (cmdObj.copyAssets) {
86:     await config.copyAssets();
87: }
88: let results = await akasha.render(config);
89: ```
90: 
91: Running `akasha.setup` performs additional setup.  The primary step there is to use the StackedDirs package to read all file information into the caches.
92: 
93: The `copyAssets` function copies the asset files into the output directory.
94: 
95: The `render` function renders all files in the documents directories into the output directory, using the plugin templates and layout templates as appropriate.
96: 
97: ## Core Dependencies
98: - **mahabhuta**: DOM manipulation engine for post-processing HTML (../mahabhuta, https://www.npmjs.com/package/mahabhuta, https://github.com/akashacms/mahabhuta).
99: - **VFStack** (lib/cache/vfstack.ts): Internal virtual file system for layered directory structures. Provides stacked directory functionality for assets, partials, layouts, and documents.
100: - **@akashacms/renderers**: Template rendering engines (Markdown, EJS, Nunjucks, etc.) (../renderers, https://www.npmjs.com/package/@akashacms/renderers, https://github.com/akashacms/rendering-engines)
101: 
102: ## AkashaCMS plugins
103: 
104: "AkashaCMS" is the name for an ecosystem including AkashaRender, Mahabhuta, @akashacms/renderers, and the plugins.  The plugins are used by AkashaRender to extend its functionality.
105: 
106: * **@akashacms/plugins-base** - Base functionality for building websites (../akashacms-base, https://www.npmjs.com/package/@akashacms/plugins-base, https://github.com/akashacms/akashacms-base)
107: * **@akashacms/plugins-blog-podcast** - Supports building a blog on an AkashaCMS website (../akashacms-blog-podcast, https://www.npmjs.com/package/@akashacms/plugins-blog-podcast, https://github.com/akashacms/akashacms-blog-podcast)
108: * **@akashacms/plugins-booknav** - Supports a certain useful navigational style (../akashacms-booknav, https://www.npmjs.com/package/@akashacms/plugins-booknav, https://github.com/akashacms/akashacms-booknav)
109: * **@akashacms/plugins-breadcrumbs** - Constructs breadcrumb trails to help navigate the website (../akashacms-breadcrumbs, https://www.npmjs.com/package/@akashacms/plugins-breadcrumbs, https://github.com/akashacms/akashacms-breadcrumbs)
110: * **@akashacms/diagrams-maker** - Handles rendering diagrams using PlantUML, Mermaid, or Printora (../plugins-diagrams, https://www.npmjs.com/package/@akashacms/diagrams-maker, https://github.com/akashacms/plugins-diagrams)
111: * **@akashacms/plugins-external-links** - Processes links to external sites, adding FAVICONs and a glyph for external links (../akashacms-external-links, https://www.npmjs.com/package/@akashacms/plugins-external-links)
112: * **@akashacms/plugins-footnotes** - Processes custom tags to add footnotes at the bottom of a web page (../akashacms-footnotes, https://www.npmjs.com/package/@akashacms/plugins-footnotes)
113: * **@akashacms/plugins-authors** - For showing an information block describing the author of an article (../akashacms-plugins-authors, https://www.npmjs.com/package/@akashacms/plugins-authors)
114: * **@akashacms/plugins-tagged-content** - Supports categorizing content using vocabulary tags, and generates per-tag index pages (../akashacms-tagged-content, https://www.npmjs.com/package/@akashacms/plugins-tagged-content)
115: * **@akashacms/theme-bootstrap** - Provides custom tags and partial template overrides for using Bootstrap 4 components on a website (../akashacms-theme-bootstrap, https://www.npmjs.com/package/@akashacms/theme-bootstrap)
116: 
117: ## AkashaCMS-based PDF document creator application
118: 
119: **PDF Document Maker** is a comprehensive tool built using AkashaCMS components with the primary purpose of creating good looking PDF documents from Markdown or AsciiDoc source files.  It also contains several PDF manipulation commands. (../pdf-document-construction-set, https://www.npmjs.com/package/@akashacms/pdf-document-maker, https://github.com/akashacms/pdf-document-construction-set)
120: 
121: ## Documentation website
122: 
123: The site, http://akashacms.com/, is the primary site for AkashaCMS documentation and news.  It serves three purposes:
124: 
125: 1. Publishing documentation and news about AkashaCMS
126: 2. Demonstrating how to configure a somewhat complex AkashaCMS website
127: 3. Demonstrating how to incorporate content that can be rendered as an EPUB into a book-like reading experience on a website
128: 
129: ## Example AkashaCMS websites
130: 
131: * **Full example** - Demonstrates all features of AkashaCMS.  Meant to help test features, while providing an example.  (../akashacms-example, https://example.akashacms.com)
132: * **Blog Skeleton** - Shows how to configure the `@akashacms/plugins-blog-podcast` plugin.  (../akashacms-blog-skeleton)
133: * **Minimal example** - Small example website (../akashacms-skeleton)
134: * **Open Source Site** - Demonstrates how an open source software project could build a website, host it on GitHub Pages, while incorporating advanced features.

(End of file - total 134 lines)
</content>
```

---

## Assistant (Build · claude-opus-4-5 · 25.5s)

**Tool: edit**

**Input:**
```json
{
  "filePath": "/home/david/Projects/akasharender/akasharender/AGENTS.md",
  "oldString": "* **Open Source Site** - Demonstrates how an open source software project could build a website, host it on GitHub Pages, while incorporating advanced features.",
  "newString": "* **Open Source Site** - Demonstrates how an open source software project could build a website, host it on GitHub Pages, while incorporating advanced features.\n\n## Multi-Agent Development Workflow\n\nThis project uses a collaborative multi-agent system for software development. Four specialized agents work together, iterating through requirements, implementation, review, and testing until the code is correct.\n\n### The Agents\n\n| Agent | Role | Tools |\n|-------|------|-------|\n| **Program Manager** | Requirements, coordination, validation | Read, Write, Grep, Glob |\n| **Builder** | Code implementation | Read, Write, Edit, Bash, Grep, Glob |\n| **Code Reviewer** | Quality and architecture checks | Read, Grep, Glob, Write |\n| **Quality Assurance** | Test writing and execution | Read, Write, Edit, Bash, Grep, Glob |\n\nAgent definitions are in `.opencode/agents/`.\n\n### Workflow Process\n\n```\nPM (requirements) --> Builder --> Code Reviewer --> QA --> PM (validation)\n                         ^              |            |           |\n                         |              v            v           v\n                         +-------- NEEDS_REVISION ---------------+\n```\n\n1. **Program Manager** defines requirements and acceptance criteria\n2. **Builder** implements the code and runs the build\n3. **Code Reviewer** validates quality, architecture, and conventions\n4. **QA** writes comprehensive tests and runs them\n5. **Program Manager** validates deliverables against requirements\n6. Any agent can route back to Builder if issues are found\n\n### State Management\n\nAgents communicate via `WORKFLOW.md` in the project root. Each agent runs with fresh context (no inherited memory), so all state must be persisted in this file.\n\nThe workflow file tracks:\n- Source feature plan (if applicable)\n- Current phase and task\n- Requirements with acceptance criteria\n- Handoff notes between agents\n- Files changed\n- Validation results\n\n### Starting New Work\n\n**Option 1: Ad-hoc Task**\n```\n@program-manager Add a function to validate configuration options\n```\n\n**Option 2: From a Feature Plan**\n```\n@program-manager Please start working on @FEATURE-Tag-Wrangling.md\n```\n\nOr use the command:\n```\n/feature-plan FEATURE-Tag-Wrangling.md\n```\n\n### Feature Plan Files\n\nFeature plans (e.g., `FEATURE-*.md`) document larger features with:\n- Problem context and background\n- Requested functionality\n- Main tasks with detailed specifications\n- Phased implementation plan\n- Testing requirements\n\nWhen working from a feature plan:\n1. Program Manager reads the entire plan\n2. Identifies completed tasks (marked DONE) vs pending tasks\n3. Extracts requirements for the next task\n4. Creates `WORKFLOW.md` scoped to that task\n5. After task completion, returns to the plan for the next task\n\n### Continuing Work\n\nIf `WORKFLOW.md` exists:\n1. Check the \"Next Agent\" field to see who should work\n2. Invoke that agent: `@builder`, `@code-reviewer`, `@quality-assurance`, or `@program-manager`\n3. The agent reads `WORKFLOW.md` and continues from the current state\n\n### Agent Invocation Examples\n\n```\n# Start from a feature plan\n@program-manager Read FEATURE-Tag-Wrangling.md and begin Phase 1\n\n# Continue with builder after PM sets requirements\n@builder\n\n# Review code after builder completes\n@code-reviewer\n\n# Run QA after code review passes\n@quality-assurance\n\n# Validate completion after QA passes\n@program-manager\n```\n\n### Commands\n\n- `/workflow` - Start or continue the development workflow\n- `/feature-plan <file>` - Start work from a feature plan file\n- `/build` - Build the project (can be used independently)\n- `/test` - Run the test suite (can be used independently)\n\n### Best Practices\n\n1. **One task at a time**: Complete each task fully before starting the next\n2. **Read WORKFLOW.md first**: Every agent should read the workflow state before starting\n3. **Update handoff notes**: Document decisions, issues, and context for the next agent\n4. **Mark completed tasks**: Update feature plan files when tasks are done\n5. **Don't skip steps**: Every code change should go through Code Review and QA\n6. **Route back when needed**: If something is wrong, send it back rather than proceeding"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Build · claude-opus-4-5 · 6.5s)

Let me verify the update looks correct:

**Tool: read**

**Input:**
```json
{
  "filePath": "/home/david/Projects/akasharender/akasharender/AGENTS.md",
  "offset": 130
}
```

**Output:**
```
<path>/home/david/Projects/akasharender/akasharender/AGENTS.md</path>
<type>file</type>
<content>130: 
131: * **Full example** - Demonstrates all features of AkashaCMS.  Meant to help test features, while providing an example.  (../akashacms-example, https://example.akashacms.com)
132: * **Blog Skeleton** - Shows how to configure the `@akashacms/plugins-blog-podcast` plugin.  (../akashacms-blog-skeleton)
133: * **Minimal example** - Small example website (../akashacms-skeleton)
134: * **Open Source Site** - Demonstrates how an open source software project could build a website, host it on GitHub Pages, while incorporating advanced features.
135: 
136: ## Multi-Agent Development Workflow
137: 
138: This project uses a collaborative multi-agent system for software development. Four specialized agents work together, iterating through requirements, implementation, review, and testing until the code is correct.
139: 
140: ### The Agents
141: 
142: | Agent | Role | Tools |
143: |-------|------|-------|
144: | **Program Manager** | Requirements, coordination, validation | Read, Write, Grep, Glob |
145: | **Builder** | Code implementation | Read, Write, Edit, Bash, Grep, Glob |
146: | **Code Reviewer** | Quality and architecture checks | Read, Grep, Glob, Write |
147: | **Quality Assurance** | Test writing and execution | Read, Write, Edit, Bash, Grep, Glob |
148: 
149: Agent definitions are in `.opencode/agents/`.
150: 
151: ### Workflow Process
152: 
153: ```
154: PM (requirements) --> Builder --> Code Reviewer --> QA --> PM (validation)
155:                          ^              |            |           |
156:                          |              v            v           v
157:                          +-------- NEEDS_REVISION ---------------+
158: ```
159: 
160: 1. **Program Manager** defines requirements and acceptance criteria
161: 2. **Builder** implements the code and runs the build
162: 3. **Code Reviewer** validates quality, architecture, and conventions
163: 4. **QA** writes comprehensive tests and runs them
164: 5. **Program Manager** validates deliverables against requirements
165: 6. Any agent can route back to Builder if issues are found
166: 
167: ### State Management
168: 
169: Agents communicate via `WORKFLOW.md` in the project root. Each agent runs with fresh context (no inherited memory), so all state must be persisted in this file.
170: 
171: The workflow file tracks:
172: - Source feature plan (if applicable)
173: - Current phase and task
174: - Requirements with acceptance criteria
175: - Handoff notes between agents
176: - Files changed
177: - Validation results
178: 
179: ### Starting New Work
180: 
181: **Option 1: Ad-hoc Task**
182: ```
183: @program-manager Add a function to validate configuration options
184: ```
185: 
186: **Option 2: From a Feature Plan**
187: ```
188: @program-manager Please start working on @FEATURE-Tag-Wrangling.md
189: ```
190: 
191: Or use the command:
192: ```
193: /feature-plan FEATURE-Tag-Wrangling.md
194: ```
195: 
196: ### Feature Plan Files
197: 
198: Feature plans (e.g., `FEATURE-*.md`) document larger features with:
199: - Problem context and background
200: - Requested functionality
201: - Main tasks with detailed specifications
202: - Phased implementation plan
203: - Testing requirements
204: 
205: When working from a feature plan:
206: 1. Program Manager reads the entire plan
207: 2. Identifies completed tasks (marked DONE) vs pending tasks
208: 3. Extracts requirements for the next task
209: 4. Creates `WORKFLOW.md` scoped to that task
210: 5. After task completion, returns to the plan for the next task
211: 
212: ### Continuing Work
213: 
214: If `WORKFLOW.md` exists:
215: 1. Check the "Next Agent" field to see who should work
216: 2. Invoke that agent: `@builder`, `@code-reviewer`, `@quality-assurance`, or `@program-manager`
217: 3. The agent reads `WORKFLOW.md` and continues from the current state
218: 
219: ### Agent Invocation Examples
220: 
221: ```
222: # Start from a feature plan
223: @program-manager Read FEATURE-Tag-Wrangling.md and begin Phase 1
224: 
225: # Continue with builder after PM sets requirements
226: @builder
227: 
228: # Review code after builder completes
229: @code-reviewer
230: 
231: # Run QA after code review passes
232: @quality-assurance
233: 
234: # Validate completion after QA passes
235: @program-manager
236: ```
237: 
238: ### Commands
239: 
240: - `/workflow` - Start or continue the development workflow
241: - `/feature-plan <file>` - Start work from a feature plan file
242: - `/build` - Build the project (can be used independently)
243: - `/test` - Run the test suite (can be used independently)
244: 
245: ### Best Practices
246: 
247: 1. **One task at a time**: Complete each task fully before starting the next
248: 2. **Read WORKFLOW.md first**: Every agent should read the workflow state before starting
249: 3. **Update handoff notes**: Document decisions, issues, and context for the next agent
250: 4. **Mark completed tasks**: Update feature plan files when tasks are done
251: 5. **Don't skip steps**: Every code change should go through Code Review and QA
252: 6. **Route back when needed**: If something is wrong, send it back rather than proceeding

(End of file - total 252 lines)
</content>
```

---

## Assistant (Build · claude-opus-4-5 · 12.7s)

The AGENTS.md file has been updated with comprehensive documentation. Here's a summary of what was added:

## Summary of AGENTS.md Updates

I added a new section **"Multi-Agent Development Workflow"** that covers:

### The Agents Table
Lists all four agents with their roles and available tools.

### Workflow Process
ASCII diagram showing the flow: PM → Builder → Code Reviewer → QA → PM, with feedback loops back to Builder.

### State Management
Explains that `WORKFLOW.md` is the communication mechanism between agents since each runs with fresh context.

### Starting New Work
Two options documented:
1. **Ad-hoc tasks**: `@program-manager <task description>`
2. **From feature plans**: `@program-manager Please start working on @FEATURE-Tag-Wrangling.md` or `/feature-plan FEATURE-Tag-Wrangling.md`

### Feature Plan Files
Explains what feature plans contain and how the agents work through them incrementally.

### Continuing Work
Instructions for checking `WORKFLOW.md` and invoking the appropriate agent.

### Agent Invocation Examples
Concrete examples showing how to invoke each agent at different workflow stages.

### Commands
Quick reference for the available commands (`/workflow`, `/feature-plan`, `/build`, `/test`).

### Best Practices
Six key guidelines for effective multi-agent collaboration.

---

## To Launch the Tag Wrangling Feature

Now you can simply run:

```
@program-manager Please start working on @FEATURE-Tag-Wrangling.md
```

Or:

```
/feature-plan FEATURE-Tag-Wrangling.md
```

The Program Manager will read the feature plan, identify that `lib/types.ts` is already DONE, and start with the next pending task (adding dependencies to `package.json`).

---

