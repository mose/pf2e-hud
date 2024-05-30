import { addListenerAll, createHTMLFromString, elementData } from "pf2e-api";
import { PF2eHudSidebar, SidebarName, SidebarRenderOptions, getSidebars } from "../sidebar";
import { PF2eHudToken, TokenSettings } from "../token";

abstract class PF2eHudTokenSidebar extends PF2eHudSidebar<TokenSettings, PF2eHudToken> {
    static DEFAULT_OPTIONS: Partial<ApplicationConfiguration> = {
        id: "pf2e-hud-token-sidebar",
    };

    get fontSize() {
        return this.setting("sidebarFontSize");
    }

    get hudKey(): "token" {
        return "token";
    }

    get parentMainElement() {
        return this.parentHud.mainElement!;
    }

    _insertElement(element: HTMLElement) {
        super._insertElement(element);
        document.body.append(element);
    }

    async _onFirstRender(context: ApplicationRenderContext, options: SidebarRenderOptions) {
        const sidebarsTemplate = await this.renderPartial("sidebars", {
            sidebars: getSidebars({}, this.sidebarKey),
        });
        const sidebarsElement = createHTMLFromString(sidebarsTemplate);
        sidebarsElement.classList.add("sidebars");
        sidebarsElement.dataset.tooltipDirection = "UP";

        this.element?.prepend(sidebarsElement);
        this.#activateSidebarsListeners(sidebarsElement);
    }

    _onRender(context: ApplicationRenderContext, options: SidebarRenderOptions) {
        if (this.setting("multiColumns")) {
            const scrollElement = this.scrollElement;

            if (scrollElement) {
                const winHeight = window.innerHeight;
                const maxHeight = this.setting("sidebarHeight");
                const scrollHeight = scrollElement.scrollHeight;
                const computedMaxHeight = winHeight * (maxHeight / 100);
                const columns = Math.clamp(Math.ceil(scrollHeight / computedMaxHeight), 1, 3);

                this.innerElement.style.setProperty("--nb-columns", String(columns));
            }
        }
    }

    _updatePosition(position = {} as ApplicationPosition) {
        const element = this.element;
        if (!element) return position;

        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        const maxHeight = this.setting("sidebarHeight");
        const bounds = element.getBoundingClientRect();
        const parentBounds = this.parentMainElement.getBoundingClientRect();

        const center = {
            x: parentBounds.x + parentBounds.width / 2,
            y: parentBounds.y + parentBounds.height / 2,
        };

        position.left = center.x - bounds.width / 2;
        position.top = center.y - bounds.height / 2;

        if (position.left + bounds.width > winWidth) position.left = winWidth - bounds.width;
        if (position.left < 0) position.left = 0;
        if (position.top + bounds.height > winHeight) position.top = winHeight - bounds.height;
        if (position.top < 0) position.top = 0;

        element.style.setProperty("left", `${position.left}px`);
        element.style.setProperty("top", `${position.top}px`);

        if (maxHeight) {
            element.style.setProperty("--max-height", `${maxHeight}vh`);
        } else {
            element.style.removeProperty("--max-height");
        }

        if (center.x <= 0 || center.x >= winWidth || center.y <= 0 || center.y >= winHeight) {
            element.style.setProperty("display", "none");
            return position;
        } else {
            element.style.removeProperty("display");
        }

        return position;
    }

    _onPosition(position: ApplicationPosition) {
        requestAnimationFrame(() => this._updatePosition());
    }

    #activateSidebarsListeners(html: HTMLElement) {
        addListenerAll(html, "[data-action='open-sidebar']", (event, el) => {
            const { sidebar } = elementData<{ sidebar: SidebarName }>(el);
            this.parentHud.toggleSidebar(sidebar);
        });
    }
}

export { PF2eHudTokenSidebar };
