// Простейший стейт прототипа (всё в памяти, без бэка)

(function () {
  const SCREENS = ["screen-today", "screen-chat", "screen-feed", "screen-more"];

  // Тема / стилистика в духе Manus
  const THEME_STORAGE_KEY = "lo_theme";
  const bodyEl = document.body;
  const themeToggle = document.getElementById("themeToggle");

  function applyTheme(theme) {
    const normalized = theme === "light" ? "light" : "dark";
    bodyEl.classList.remove("theme-light", "theme-dark");
    bodyEl.classList.add(`theme-${normalized}`);

    if (themeToggle) {
      themeToggle.setAttribute("data-theme", normalized);
      themeToggle.setAttribute("aria-pressed", normalized === "light" ? "true" : "false");
    }
  }

  function initTheme() {
    let stored = null;
    try {
      stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    } catch (e) {
      stored = null;
    }

    let theme = stored;
    if (theme !== "light" && theme !== "dark") {
      const prefersDark =
        window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      theme = prefersDark ? "dark" : "light";
    }

    applyTheme(theme);
  }

  initTheme();

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const isLight = bodyEl.classList.contains("theme-light");
      const next = isLight ? "dark" : "light";
      applyTheme(next);
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch (e) {
        // игнорируем, если localStorage недоступен
      }
    });
  }

  // Онбординг
  const onboardingEl = document.getElementById("onboarding");
  const onboardingStartBtn = document.getElementById("onboardingStartBtn");
  const onboardingSteps = document.querySelectorAll(".onboarding-step");
  let onboardingCurrentStep = 0;

  const onboardingState = {
    areas: new Set(),
    focuses: new Set(),
    salary: null,
    incomeFreq: "monthly",
    safeReserve: null,
    dayType: "office",
  };

  const onbSalaryInput = document.getElementById("onbSalaryInput");
  const onbIncomeFreqSelect = document.getElementById("onbIncomeFreqSelect");
  const onbSafeReserveInput = document.getElementById("onbSafeReserveInput");
  const onbDayTypeSelect = document.getElementById("onbDayTypeSelect");
  const onboardingAreasNextBtn = document.getElementById("onboardingAreasNextBtn");
  const onboardingFinanceNextBtn = document.getElementById("onboardingFinanceNextBtn");
  const onboardingFinanceSkipBtn = document.getElementById("onboardingFinanceSkipBtn");
  const onboardingFinishBtn = document.getElementById("onboardingFinishBtn");
  const todayBudgetValue = document.getElementById("todayBudgetValue");
  const dailyTipEl = document.getElementById("dailyTip");
  const todayFocusHintEl = document.getElementById("todayFocusHint");

  let preferredTopics = [];

  function showOnboardingStep(step) {
    onboardingCurrentStep = step;
    onboardingSteps.forEach((el) => {
      const stepIndex = Number(el.getAttribute("data-step"));
      el.classList.toggle("onboarding-step--active", stepIndex === step);
    });
    if (onboardingEl && !onboardingEl.classList.contains("onboarding--visible")) {
      onboardingEl.classList.add("onboarding--visible");
    }
  }

  function updateBudgetFromState() {
    if (!todayBudgetValue) return;
    let value = 2000;
    if (typeof onboardingState.salary === "number" && onboardingState.salary > 0) {
      const salary = onboardingState.salary;
      const monthlyForJoy = salary * 0.08; // условный небольшой процент на «радости»
      const daily = Math.round(monthlyForJoy / 30 / 100) * 100;
      value = Math.max(500, daily);
    }
    todayBudgetValue.textContent = `${value.toLocaleString("ru-RU")} ₽`;
  }

  function saveFinanceFromForm() {
    if (onbSalaryInput) {
      const salaryRaw = parseInt(onbSalaryInput.value, 10);
      if (!Number.isNaN(salaryRaw) && salaryRaw > 0) {
        onboardingState.salary = salaryRaw;
      }
    }
    if (onbIncomeFreqSelect) {
      onboardingState.incomeFreq = onbIncomeFreqSelect.value || "monthly";
    }
    if (onbSafeReserveInput) {
      const reserveRaw = parseInt(onbSafeReserveInput.value, 10);
      if (!Number.isNaN(reserveRaw) && reserveRaw >= 0) {
        onboardingState.safeReserve = reserveRaw;
      }
    }
    updateBudgetFromState();
  }

  // Изначально подсказка по деньгам на дефолтных значениях
  updateBudgetFromState();

  if (onboardingStartBtn && onboardingEl) {
    onboardingStartBtn.addEventListener("click", () => {
      showOnboardingStep(1);
    });
  }

  if (onboardingAreasNextBtn) {
    onboardingAreasNextBtn.addEventListener("click", () => {
      showOnboardingStep(2);
    });
  }

  if (onboardingFinanceNextBtn) {
    onboardingFinanceNextBtn.addEventListener("click", () => {
      saveFinanceFromForm();
      showOnboardingStep(3);
    });
  }

  if (onboardingFinanceSkipBtn) {
    onboardingFinanceSkipBtn.addEventListener("click", () => {
      showOnboardingStep(3);
    });
  }

  if (onboardingFinishBtn) {
    onboardingFinishBtn.addEventListener("click", () => {
      if (onbDayTypeSelect) {
        onboardingState.dayType = onbDayTypeSelect.value || "office";
      }
      applyFocusPersonalization();
      if (onboardingEl) {
        onboardingEl.classList.remove("onboarding--visible");
      }
    });
  }

  // Переключение экранов по нижней навигации
  const navButtons = document.querySelectorAll("[data-screen-target]");

  function setActiveScreen(screenId) {
    SCREENS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.toggle("screen--active", id === screenId);
      }
    });

    navButtons.forEach((btn) => {
      const target = btn.getAttribute("data-screen-target");
      btn.classList.toggle("bottom-nav__item--active", target === screenId);
    });
  }

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-screen-target");
      if (target) {
        setActiveScreen(target);
      }
    });
  });

  // Поддержка кнопок, которые явно открывают экран (например, "Обсудить с компаньоном")
  document.body.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const onboardingOptionEl = target.closest(".onboarding-option");
    if (onboardingOptionEl instanceof HTMLElement) {
      if (onboardingOptionEl.hasAttribute("data-area")) {
        const area = onboardingOptionEl.getAttribute("data-area");
        if (area) {
          if (onboardingState.areas.has(area)) {
            onboardingState.areas.delete(area);
            onboardingOptionEl.classList.remove("onboarding-option--selected");
          } else {
            onboardingState.areas.add(area);
            onboardingOptionEl.classList.add("onboarding-option--selected");
          }
        }
      }
      if (onboardingOptionEl.hasAttribute("data-focus")) {
        const focus = onboardingOptionEl.getAttribute("data-focus");
        if (focus) {
          if (onboardingState.focuses.has(focus)) {
            onboardingState.focuses.delete(focus);
            onboardingOptionEl.classList.remove("onboarding-option--selected");
          } else {
            onboardingState.focuses.add(focus);
            onboardingOptionEl.classList.add("onboarding-option--selected");
          }
        }
      }
    }

    const openScreen = target.getAttribute("data-open-screen");
    if (openScreen === "chat") {
      setActiveScreen("screen-chat");
    }
  });

  // Селектор настроения
  const moodButtons = document.querySelectorAll(".mood-selector__item");
  const moodHint = document.getElementById("moodHint");

  moodButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mood = btn.getAttribute("data-mood");
      moodButtons.forEach((b) => b.classList.remove("mood-selector__item--active"));
      btn.classList.add("mood-selector__item--active");

      if (!moodHint) return;
      switch (mood) {
        case "1":
          moodHint.textContent =
            "Понял, день непростой. В прототипе я просто запомню это и посоветую не перегружать себя.";
          break;
        case "2":
          moodHint.textContent =
            "Чуть ниже среднего. Может, стоит пересмотреть приоритеты на сегодня и выкинуть лишнее?";
          break;
        case "3":
          moodHint.textContent =
            "Нормальный день. В боевой версии я бы помог аккуратно подтянуть здоровье и финансы.";
          break;
        case "4":
          moodHint.textContent =
            "Отлично! Такой день можно использовать, чтобы сделать одно важное дело вперёд плана.";
          break;
        case "5":
          moodHint.textContent =
            "Супер! Сохраним это ощущение и постараемся не перегореть. Я помогу держать баланс.";
          break;
        default:
          moodHint.textContent =
            "Сегодня настроения пока нет в истории — я просто запомню твой выбор.";
      }
    });
  });

  // Модалки

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add("modal--visible");
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove("modal--visible");
  }

  document.body.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const openId = target.getAttribute("data-open-modal");
    const closeAttr = target.getAttribute("data-close-modal");

    if (openId === "purchase") {
      openModal("purchaseModal");
    }

    if (closeAttr !== null || target.hasAttribute("data-close-modal")) {
      const modalEl = target.closest(".modal");
      if (modalEl && modalEl.id) {
        closeModal(modalEl.id);
      }
    }

    if (target.classList.contains("modal__backdrop")) {
      const parentModal = target.closest(".modal");
      if (parentModal && parentModal.id) {
        closeModal(parentModal.id);
      }
    }
  });

  // Добавление задачи (рыба)

  const addTaskBtn = document.getElementById("addTaskBtn");
  const taskModal = document.getElementById("taskModal");
  const taskInput = document.getElementById("taskInput");
  const taskSaveBtn = document.getElementById("taskSaveBtn");
  const todayTaskList = document.getElementById("todayTaskList");

  if (addTaskBtn && taskModal) {
    addTaskBtn.addEventListener("click", () => {
      openModal("taskModal");
      if (taskInput) {
        taskInput.value = "";
        taskInput.focus();
      }
    });
  }

  if (taskSaveBtn && taskInput && todayTaskList) {
    taskSaveBtn.addEventListener("click", () => {
      const value = taskInput.value.trim();
      if (!value) {
        taskInput.focus();
        return;
      }

      const li = document.createElement("li");
      li.className = "task-item";
      li.innerHTML = `
        <label class="task-item__label">
          <input type="checkbox">
          <span class="task-item__title">${value}</span>
        </label>
        <span class="task-item__tag">Рыба</span>
      `;
      todayTaskList.appendChild(li);
      closeModal("taskModal");
    });
  }

  // Активность (шаги, рыба-инкремент)

  const stepsValue = document.getElementById("stepsValue");
  const addStepsBtn = document.getElementById("addStepsBtn");
  let currentSteps = 3200;

  if (stepsValue) {
    stepsValue.textContent = String(currentSteps);
  }

  if (addStepsBtn && stepsValue) {
    addStepsBtn.addEventListener("click", () => {
      currentSteps += 800;
      stepsValue.textContent = String(currentSteps);
    });
  }

  // Чат: простая имитация сценариев

  const chatWindow = document.getElementById("chatWindow");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");

  function appendChatMessage({ text, from }) {
    if (!chatWindow) return;
    const wrapper = document.createElement("div");
    wrapper.className = `chat-message chat-message--${from}`;
    const bubble = document.createElement("div");
    bubble.className = "chat-message__bubble";
    bubble.textContent = text;
    const time = document.createElement("div");
    time.className = "chat-message__time";
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    time.textContent = `${hh}:${mm}`;
    wrapper.appendChild(bubble);
    wrapper.appendChild(time);
    chatWindow.appendChild(wrapper);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function handleTemplate(template) {
    if (!template) return;

    if (template === "dayReview") {
      appendChatMessage({
        from: "bot",
        text: "Давай. Что самое важное, что ты хочешь успеть сегодня?",
      });
    }

    if (template === "purchase") {
      appendChatMessage({
        from: "bot",
        text: "Расскажи, что хочешь купить и примерно за какую сумму.",
      });
    }

    if (template === "vent") {
      appendChatMessage({
        from: "bot",
        text: "Пиши всё как есть. Я здесь, чтобы помочь разложить мысли по полочкам (в прототипе — рыбой).",
      });
    }
  }

  document.body.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const tmpl = target.getAttribute("data-chat-template");
    if (tmpl) {
      handleTemplate(tmpl);
    }
  });

  if (chatForm && chatInput) {
    chatForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = chatInput.value.trim();
      if (!value) return;
      appendChatMessage({ from: "user", text: value });
      chatInput.value = "";

      // Примитивные ответы (рыба)
      const lower = value.toLowerCase();
      if (lower.includes("куп") || lower.includes("наушник")) {
        appendChatMessage({
          from: "bot",
          text:
            "Если брать наушники сейчас, это окей как единичная покупка. В реальной версии я бы сверился с твоими тратами за месяц.",
        });
      } else if (lower.includes("устал") || lower.includes("выгор") || lower.includes("устала")) {
        appendChatMessage({
          from: "bot",
          text:
            "Похоже, ты вымотан(а). В прототипе я просто посоветую: сними с себя один пункт на сегодня и сделай что-то маленькое для восстановления.",
        });
      } else if (lower.includes("план") || lower.includes("спланируй")) {
        appendChatMessage({
          from: "bot",
          text:
            "Давай выберем одно главное дело и два второстепенных. Напиши, что для тебя главное сегодня.",
        });
      } else {
        appendChatMessage({
          from: "bot",
          text:
            "Супер, я запомню это как контекст дня. В продакшене здесь будет настоящий ИИ-диалог. Сейчас — только демонстрация формата.",
        });
      }
    });
  }

  // Лента: рыба-контент

  const feedList = document.getElementById("feedList");
  const feedFilters = document.getElementById("feedFilters");

  const FEED_ITEMS = [
    {
      id: "f1",
      topic: "finance",
      topicLabel: "Финансы",
      title: "Как перестать сливать зарплату в первые 3 дня",
      excerpt:
        "Три маленьких ограничения, которые почти не чувствуются, но сильно снижают импульсивные траты.",
      length: "5 минут чтения",
    },
    {
      id: "f2",
      topic: "productivity",
      topicLabel: "Продуктивность",
      title: "Правило одного главного дела",
      excerpt:
        "Почему список из 15 задач убивает мотивацию, и как перейти на один главный фокус в день.",
      length: "4 минуты чтения",
    },
    {
      id: "f3",
      topic: "health",
      topicLabel: "Здоровье",
      title: "10-минутная прогулка как мини-лекарство",
      excerpt:
        "Как короткий выход на улицу меняет уровень стресса и концентрации лучше, чем очередной кофе.",
      length: "3 минуты чтения",
    },
    {
      id: "f4",
      topic: "psychology",
      topicLabel: "Психология",
      title: "Как мягко говорить «нет»",
      excerpt:
        "Несколько фраз, которые помогают отказываться без чувства вины и испорченных отношений.",
      length: "6 минут чтения",
    },
    {
      id: "f5",
      topic: "finance",
      topicLabel: "Финансы",
      title: "Страж подписок: где утекают деньги",
      excerpt:
        "Раз в месяц пересматривай список подписок. В боевой версии я помогу сделать это за тебя.",
      length: "4 минуты чтения",
    },
  ];

  function topicOrderIndex(topic) {
    if (!preferredTopics || preferredTopics.length === 0) return 0;
    const idx = preferredTopics.indexOf(topic);
    return idx === -1 ? preferredTopics.length + 1 : idx;
  }

  function renderFeed(topicFilter) {
    if (!feedList) return;
    feedList.innerHTML = "";
    const base =
      topicFilter && topicFilter !== "all"
        ? FEED_ITEMS.filter((item) => item.topic === topicFilter)
        : FEED_ITEMS;

    const itemsToShow =
      topicFilter && topicFilter !== "all"
        ? base
        : [...base].sort((a, b) => topicOrderIndex(a.topic) - topicOrderIndex(b.topic));

    itemsToShow.forEach((item) => {
      const card = document.createElement("article");
      card.className = "feed-card";
      card.innerHTML = `
        <div class="feed-card__topic">${item.topicLabel}</div>
        <h3 class="feed-card__title">${item.title}</h3>
        <p class="feed-card__excerpt">${item.excerpt}</p>
        <div class="feed-card__meta">
          <span>${item.length}</span>
          <button class="link-button" data-open-screen="chat">
            Обсудить в чате
          </button>
        </div>
      `;
      feedList.appendChild(card);
    });

    if (itemsToShow.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "По этой теме пока нет заметок (рыба).";
      empty.style.fontSize = "13px";
      empty.style.color = "#9a9ebb";
      feedList.appendChild(empty);
    }
  }

  if (feedFilters) {
    feedFilters.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const topic = target.getAttribute("data-topic");
      if (!topic) return;

      const chips = feedFilters.querySelectorAll(".chip");
      chips.forEach((chip) => chip.classList.remove("chip--active"));
      target.classList.add("chip--active");
      renderFeed(topic);
    });
  }

  renderFeed("all");

  // Персонализация советов и ленты на основе фокусов

  function applyFocusPersonalization() {
    const hasHealth = onboardingState.focuses.has("health") || onboardingState.areas.has("health");
    const hasCareer =
      onboardingState.focuses.has("career") ||
      onboardingState.areas.has("finance") ||
      onboardingState.areas.has("life");
    const hasRelations = onboardingState.focuses.has("relations");
    const hasBalance =
      onboardingState.focuses.has("balance") || onboardingState.areas.has("rest");

    if (dailyTipEl) {
      if (hasHealth && !hasCareer) {
        dailyTipEl.textContent =
          "Сделай сегодня один маленький шаг для тела: короткая прогулка, стакан воды или 15 минут без экрана.";
      } else if (hasCareer) {
        dailyTipEl.textContent =
          "Выбери одно главное дело по работе или деньгам и сделай его чуть раньше, чем планировал(а). Остальное можно упростить.";
      } else if (hasBalance) {
        dailyTipEl.textContent =
          "Запланируй сегодня момент, когда ты сознательно ничего не делаешь 10–15 минут. Это тоже задача.";
      } else if (hasRelations) {
        dailyTipEl.textContent =
          "Напиши или позвони одному человеку, о ком давно думал(а), но откладывал(а). Маленький контакт даёт много тепла.";
      } else {
        dailyTipEl.textContent =
          "Сегодня не нагружай вечер: выбери одно главное дело и дай себе время восстановиться.";
      }
    }

    if (todayFocusHintEl) {
      const focusLabels = [];
      if (hasHealth) focusLabels.push("здоровье и энергия");
      if (hasCareer) focusLabels.push("карьера и деньги");
      if (hasRelations) focusLabels.push("отношения и семья");
      if (hasBalance) focusLabels.push("баланс и отдых");

      if (focusLabels.length > 0) {
        todayFocusHintEl.textContent = `Список ниже я буду собирать вокруг твоих фокусов: ${focusLabels.join(
          ", "
        )} (сейчас это рыба, позже станет живым).`;
      } else {
        todayFocusHintEl.textContent =
          "Здесь будут задачи под твои текущие фокусы — здоровье, деньги, отношения и баланс (рыба).";
      }
    }

    const topics = [];
    if (hasCareer) {
      topics.push("finance", "productivity");
    }
    if (hasHealth) {
      topics.push("health");
    }
    if (hasRelations) {
      topics.push("psychology");
    }
    if (hasBalance) {
      topics.push("health", "psychology");
    }
    const deduped = [];
    topics.forEach((t) => {
      if (!deduped.includes(t)) deduped.push(t);
    });
    preferredTopics = deduped;

    const feedSubtitleEl = document.querySelector("#screen-feed .screen__subtitle");
    if (feedSubtitleEl) {
      if (preferredTopics.length === 0) {
        feedSubtitleEl.textContent = "Подборка коротких заметок от ИИ (рыба)";
      } else {
        feedSubtitleEl.textContent =
          "Сейчас больше заметок под твои фокусы — финансы, продуктивность, здоровье и психологию (рыба).";
      }
    }

    renderFeed("all");
  }
})();

