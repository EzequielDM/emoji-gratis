/**
 * @name EmojiGratis
 * @displayName Emoji Grátis
 * @description Manda emoji de grátis pq pagar por nitro é besteira
 * @author Zeki
 * @authorId 226701030031753216
 * @license MIT
 * @version 1.1.0
 * @invite fufCxzm
 * @source tobedetermined
 * @updateUrl tobedetermined
 */
/*@cc_on
@if (@_jscript)
    
    // Offer to self-install for clueless users that try to run this directly.
    var shell = WScript.CreateObject("WScript.Shell");
    var fs = new ActiveXObject("Scripting.FileSystemObject");
    var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\BetterDiscord\plugins");
    var pathSelf = WScript.ScriptFullName;
    // Put the user at ease by addressing them in the first person
    shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
    if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
        shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
    } else if (!fs.FolderExists(pathPlugins)) {
        shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
    } else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
        fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
        // Show the user where to put plugins in the future
        shell.Exec("explorer " + pathPlugins);
        shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
    }
    WScript.Quit();

@else@*/

module.exports = (() => {
  const config = {
    info: {
      name: "EmojiGratis",
      authors: [
        {
          name: "Zeki",
          discord_id: "226701030031753216",
          github_username: "EzequielDM",
        },
      ],
      version: "1.1.0",
      description: "Manda emoji de grátis pq pagar por nitro é besteira",
      github: "tobedetermined",
      github_raw: "tobedetermined",
    },
    changelog: [
      {
        title: "Enviado",
        types: "fixed",
        items: ["Enviado para o GitHub e agora lista funciona."],
      },
    ],
    defaultConfig: [
      {
        type: "switch",
        id: "sendDirectly",
        name: "Enviar diretamente",
        note: "Envia o emoji direto sem ir pra caixa de texto.",
        value: false,
      },
      {
        type: "slider",
        id: "emojiSize",
        name: "Tamanho do emoji",
        note: "O tamanho do treco em pixels, o normal é 48.",
        value: 48,
        markers: [32, 40, 48, 60, 64],
        stickToMarkers: true,
      },
      {
        type: "dropdown",
        id: "removeGrayscale",
        name: "Tirar cinza dos emoji",
        note: "Tira aquele filtro cinza de cima da lista de emoji.",
        value: "embedPerms",
        options: [
          {
            label: "Sempre",
            value: "always",
          },
          {
            label: "Com permissões",
            value: "embedPerms",
          },
          {
            label: "Nunca",
            value: "never",
          },
        ],
      },
      {
        type: "dropdown",
        id: "missingEmbedPerms",
        name: "Se n tiver permissão",
        note: "Isso aqui vai acontecer se tu n tiver permissão de dar embed no server.",
        value: "showDialog",
        options: [
          {
            label: "Mostrar caixa de prompt",
            value: "showDialog",
          },
          {
            label: "Enfia e dane-se",
            value: "insert",
          },
          {
            label: "Faz nada",
            value: "nothing",
          },
        ],
      },
      {
        type: "dropdown",
        id: "unavailable",
        name: "Usar emojis impossíveis",
        note: "Permite usar emojis que nem com nitro tu conseguiria, tipo emoji de server que perdeu boost.",
        value: "allow",
        options: [
          {
            label: "Permitir",
            value: "allow",
          },
          {
            label: "Caixa de confirmação",
            value: "showDialog",
          },
          {
            label: "Não",
            value: "off",
          },
        ],
      },
      {
        type: "dropdown",
        id: "external",
        name: "Permitir emojis externos",
        note: "Permite emojis externos pra servidores que bloquearam.",
        value: "showDialog",
        options: [
          {
            label: "Não",
            value: "off",
          },
          {
            label: "Confirmação",
            value: "showDialog",
          },
        ],
      },
    ],
  };
  return !global.ZeresPluginLibrary
    ? class {
        constructor() {
          this._config = config;
        }
        load() {
          BdApi.showConfirmationModal(
            "Library plugin is needed",
            [
              `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`,
            ],
            {
              confirmText: "Download",
              cancelText: "Cancel",
              onConfirm: () => {
                require("request").get(
                  "https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js",
                  async (error, response, body) => {
                    if (error)
                      return require("electron").shell.openExternal(
                        "https://betterdiscord.app/Download?id=9"
                      );
                    await new Promise((r) =>
                      require("fs").writeFile(
                        require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"),
                        body,
                        r
                      )
                    );
                    window.location.reload();
                  }
                );
              },
            }
          );
        }
        start() {}
        stop() {}
      }
    : (([Plugin, Api]) => {
        const plugin = (Plugin, Api) => {
          const {
            Patcher,
            WebpackModules,
            Toasts,
            Logger,
            DiscordModules: {
              Permissions,
              DiscordPermissions,
              UserStore,
              SelectedChannelStore,
              ChannelStore,
              DiscordConstants: { EmojiDisabledReasons, EmojiIntention },
            },
          } = Api;

          const Emojis = WebpackModules.findByUniqueProperties([
            "getDisambiguatedEmojiContext",
            "search",
          ]);
          const EmojiParser = WebpackModules.findByUniqueProperties([
            "parse",
            "parsePreprocessor",
            "unparse",
          ]);
          const EmojiPicker = WebpackModules.findByUniqueProperties(["useEmojiSelectHandler"]);
          const MessageUtilities = WebpackModules.getByProps("sendMessage");
          const EmojiFilter = WebpackModules.getByProps("getEmojiUnavailableReason");

          const EmojiPickerListRow = WebpackModules.find(
            (m) => m?.default?.displayName == "EmojiPickerListRow"
          );

          const SIZE_REGEX = /([?&]size=)(\d+)/;

          return class Freemoji extends Plugin {
            currentUser = null;

            replaceEmoji(text, emoji) {
              const emojiString = `<${emoji.animated ? "a" : ""}:${
                emoji.originalName || emoji.name
              }:${emoji.id}>`;
              const emojiURL = this.getEmojiUrl(emoji);
              return text.replace(emojiString, emojiURL);
            }

            patch() {
              // make emote pretend locked emoji are unlocked
              Patcher.after(Emojis, "search", (_, args, ret) => {
                ret.unlocked = ret.unlocked.concat(ret.locked);
                ret.locked.length = [];
                return ret;
              });

              // replace emoji with links in messages
              Patcher.after(EmojiParser, "parse", (_, args, ret) => {
                for (const emoji of ret.invalidEmojis) {
                  ret.content = this.replaceEmoji(ret.content, emoji);
                }
                if (this.settings.allowUnavailable) {
                  for (const emoji of ret.validNonShortcutEmojis) {
                    if (!emoji.available) {
                      ret.content = this.replaceEmoji(ret.content, emoji);
                    }
                  }
                }
                if (this.settings.external) {
                  for (const emoji of ret.validNonShortcutEmojis) {
                    if (
                      this.getEmojiUnavailableReason(emoji) ===
                      EmojiDisabledReasons.DISALLOW_EXTERNAL
                    ) {
                      ret.content = this.replaceEmoji(ret.content, emoji);
                    }
                  }
                }
                return ret;
              });

              // override emoji picker to allow selecting emotes
              Patcher.after(EmojiPicker, "useEmojiSelectHandler", (_, args, ret) => {
                const { onSelectEmoji, closePopout, selectedChannel } = args[0];
                const self = this;

                return function (data, state) {
                  if (state.toggleFavorite) return ret.apply(this, arguments);

                  const emoji = data.emoji;
                  const isFinalSelection = state.isFinalSelection;

                  if (
                    self.getEmojiUnavailableReason(emoji, selectedChannel) ===
                    EmojiDisabledReasons.DISALLOW_EXTERNAL
                  ) {
                    if (self.settings.external == "off") return;

                    if (self.settings.external == "showDialog") {
                      BdApi.showConfirmationModal(
                        "Sending External Emoji",
                        [
                          `It looks like you are trying to send an an External Emoji in a server that would normally allow it. Do you still want to send it?`,
                        ],
                        {
                          confirmText: "Send External Emoji",
                          cancelText: "Cancel",
                          onConfirm: () => {
                            self.selectEmoji({
                              emoji,
                              isFinalSelection,
                              onSelectEmoji,
                              selectedChannel,
                              closePopout,
                              disabled: true,
                            });
                          },
                        }
                      );
                      return;
                    }
                    self.selectEmoji({
                      emoji,
                      isFinalSelection,
                      onSelectEmoji,
                      closePopout,
                      selectedChannel,
                      disabled: true,
                    });
                  } else if (!emoji.available) {
                    if (self.settings.unavailable == "off") return;

                    if (self.settings.external == "showDialog") {
                      BdApi.showConfirmationModal(
                        "Enviando Emoji Impossível",
                        [`Tu ta tentando mandar emoji que nem nitro consegue, quer memo?`],
                        {
                          confirmText: "Bora",
                          cancelText: "Nope",
                          onConfirm: () => {
                            self.selectEmoji({
                              emoji,
                              isFinalSelection,
                              onSelectEmoji,
                              closePopout,
                              selectedChannel,
                              disabled: true,
                            });
                          },
                        }
                      );
                      return;
                    }
                    self.selectEmoji({
                      emoji,
                      isFinalSelection,
                      onSelectEmoji,
                      closePopout,
                      selectedChannel,
                      disabled: true,
                    });
                  } else {
                    self.selectEmoji({
                      emoji,
                      isFinalSelection,
                      onSelectEmoji,
                      closePopout,
                      selectedChannel,
                      disabled: data.isDisabled,
                    });
                  }
                };
              });

              Patcher.after(
                EmojiFilter,
                "getEmojiUnavailableReason",
                (_, [{ intention, bypassPatch }], ret) => {
                  if (intention !== EmojiIntention.CHAT || bypassPatch || !this.settings.external)
                    return;
                  return ret === EmojiDisabledReasons.DISALLOW_EXTERNAL ? null : ret;
                }
              );

              Patcher.before(EmojiPickerListRow, "default", (_, [{ emojiDescriptors }]) => {
                if (this.settings.removeGrayscale == "never") return;
                if (this.settings.removeGrayscale != "always" && !this.hasEmbedPerms()) return;
                emojiDescriptors
                  .filter((e) => e.isDisabled)
                  .forEach((e) => {
                    e.isDisabled = false;
                    e.wasDisabled = true;
                  });
              });
              Patcher.after(EmojiPickerListRow, "default", (_, [{ emojiDescriptors }]) => {
                emojiDescriptors
                  .filter((e) => e.wasDisabled)
                  .forEach((e) => {
                    e.isDisabled = true;
                    delete e.wasDisabled;
                  });
              });
            }

            selectEmoji({
              emoji,
              isFinalSelection,
              onSelectEmoji,
              closePopout,
              selectedChannel,
              disabled,
            }) {
              console.log("disabled", disabled);
              if (disabled) {
                console.log("disabled");
                const perms = this.hasEmbedPerms(selectedChannel);
                if (!perms && this.settings.missingEmbedPerms == "nothing") return;
                if (!perms && this.settings.missingEmbedPerms == "showDialog") {
                  BdApi.showConfirmationModal(
                    "Sem permissão irmão",
                    [
                      `Tu não tem permissão de dar embed das imagens nesse servidor, quer enviar memo assim?.`,
                    ],
                    {
                      confirmText: "Issae",
                      cancelText: "Sai fora",
                      onConfirm: () => {
                        if (this.settings.sendDirectly) {
                          MessageUtilities.sendMessage(selectedChannel.id, {
                            content: this.getEmojiUrl(emoji),
                          });
                        } else {
                          onSelectEmoji(emoji, isFinalSelection);
                        }
                      },
                    }
                  );
                  return;
                }
                if (this.settings.sendDirectly) {
                  MessageUtilities.sendMessage(SelectedChannelStore.getChannelId(), {
                    content: this.getEmojiUrl(emoji),
                  });
                } else {
                  onSelectEmoji(emoji, isFinalSelection);
                }
              } else {
                onSelectEmoji(emoji, isFinalSelection);
              }

              if (isFinalSelection) closePopout();
            }

            getEmojiUnavailableReason(emoji, channel, intention) {
              return EmojiFilter.getEmojiUnavailableReason({
                channel: channel || ChannelStore.getChannel(SelectedChannelStore.getChannelId()),
                emoji,
                intention: EmojiIntention.CHAT || intention,
                bypassPatch: true,
              });
            }

            getEmojiUrl(emoji) {
              return emoji.url.includes("size=")
                ? emoji.url.replace(SIZE_REGEX, `$1${this.settings.emojiSize}`)
                : `${emoji.url}&size=${this.settings.emojiSize}`;
            }

            hasEmbedPerms(channelParam) {
              try {
                if (!this.currentUser) this.currentUser = UserStore.getCurrentUser();
                const channel =
                  channelParam || ChannelStore.getChannel(SelectedChannelStore.getChannelId());
                if (!channel.guild_id) return true;
                return Permissions.can(
                  DiscordPermissions.EMBED_LINKS,
                  this.currentUser.id,
                  channel
                );
              } catch (e) {
                Logger.error("Falha ao detectar permissão para embed", e);
                return true;
              }
            }

            cleanup() {
              Patcher.unpatchAll();
            }

            onStart() {
              try {
                this.patch();
              } catch (e) {
                Toasts.error(`${config.info.name}: An error occured during intialiation: ${e}`);
                Logger.error(`Error while patching: ${e}`);
                console.error(e);
              }
            }

            onStop() {
              this.cleanup();
            }

            getSettingsPanel() {
              return this.buildSettingsPanel().getElement();
            }
          };
        };
        return plugin(Plugin, Api);
      })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/
