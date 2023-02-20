const electron = require('electron');
const Store = require('electron-store');
const Clone = require('clone');
const OJD = window.OJD;
/*
	Class Config
	System wide config handler for objects.
*/
class Config {

    /*
     * constructor(cwd)
     * Config class constructor.
     */
    constructor() {

        // Electron Store
        this.store = new Store();

        // Class Variables
        this.config = {};
        this.currentMapping = {};

        // Make new config if one doesn't exist.
        this.init();

        const currentVersion = 4;
        for (var version = 0; version < currentVersion; version++) {
            if (version == 0) {
                this.migrateConfigV0();
                continue;
            }
            this.migrateConfig(version);
        }
    }

    /*
     * init()
     * @param bool reset - Overloaded method for reseting regardless of current state.
     * @return bool
     * Makes a new configuration if this is the first time it's being used.
     */
    init(reset = false) {

        if (typeof this.store.get('config') !== 'undefined') {
            if (!reset) {
                this.config = this.store.get('config');
                return false;
            }
        }

        const config = require(OJD.appendCwdPath('app/js/data/config.json'));
        const profile = require(OJD.appendCwdPath('app/js/data/profile.json'));
        const mappings = require(OJD.appendCwdPath('app/js/data/mappings.json'));

        // Center on Screen
        const screenSize = electron.screen.getPrimaryDisplay().size;
        config.bounds.x = parseInt((screenSize.width - config.bounds.width) / 2, 10);
        config.bounds.y = parseInt((screenSize.height - config.bounds.height) / 2, 10);

        this.store.set('mappings', mappings);
        this.store.set('profiles', [profile]);
        this.store.set('config', config);

        this.config = this.store.get('config');

        return true;
    }

    migrateConfig(version) {
        if (this.config.version !== version) {
            return false;
        }

        const newVersion = version++;
        const mappings = this.store.get('mappings');

        this.versionSpecificUpgrade(version, mappings);

        this.store.set('mappings', mappings);

        // Set Config to Version 4
        this.config.version = newVersion;
        this.store.set('config', this.config);

        // Reload
        this.config = this.store.get('config');
    }

    versionSpecificUpgrade(version, mappings) {
        switch (version) {
            case 3:
            case 2:
                this.addNewMappings(version, mappings);
                for (const map of mappings) {
                    map.triggerFixed = [];
                }
                break;
            case 1:
                this.addNewMappings(version, mappings);
                break;
        }
    }

    addNewMappings(version, mappings) {
        const newVersion = version++;
        const path = 'app/js/data/mappings-v' + newVersion + '.json';
        const newMappings = require(OJD.appendCwdPath());

        for (const map of newMappings) {
            mappings.push(map);
        }
    }

    /*
     * migrateConfigZero()
     * @return bool
     * Migrates config version 0 to version 1. Separates mappings and profile from core config for easy backups.
     */
    migrateConfigV0() {

        if (this.config.version !== 0) {
            return false;
        }

        // Migrate to new profile system, will be removed in future releases.
        const profile = require(OJD.appendCwdPath('app/js/data/profile.json'));
        const mappings = Clone(this.config.mappings);

        profile.theme = this.config.theme;
        profile.map = this.config.map;
        profile.chroma = this.config.chroma;
        profile.chromaColor = this.config.chromaColor;
        profile.alwaysOnTop = this.config.alwaysOnTop;
        profile.zoom = this.config.zoom * 100;

        // Remove, no longer in config store.
        delete this.config.theme;
        delete this.config.map;
        delete this.config.chroma;
        delete this.config.chromaColor;
        delete this.config.alwaysOnTop;
        delete this.config.zoom;
        delete this.config.mappings;

        this.config.profile = 0;

        this.config.version = 1;
        this.store.set('mappings', mappings);
        this.store.set('profiles', [profile]);
        this.store.set('config', this.config);

        // Reload
        this.config = this.store.get('config');

        return true;

    }

    /*
     * setBounds(bounds)
     * @param object bounds
     * @return object
     * Sets the current bounds of the window in non-broadcast mode. {x:, y:, height:, width:}.
     */
    setBounds(bounds) {
        this.config.bounds = Clone(bounds);
        this.save();
        return bounds;
    }

    /*
     * getBounds()
     * @return object
     * Returns the current bounds of the window when in interface mode. {x:, y:, height:, width:}. Typically used during launch.
     */
    getBounds() {
        return this.config.bounds;
    }

    /*
     * toggleBroadcast()
     * @return bool
     * Toggles between interface and broadcast mode.
     */
    toggleBroadcast() {
        this.config.broadcast = !this.config.broadcast;
        this.save();
        return this.config.broadcast;
    }

    /*
     * getBroadcast()
     * @return bool
     * Determines if we're in interface or broadcast mode.
     */
    getBroadcast() {
        return this.config.broadcast;
    }

    /*
     * toggleInterface()
     * @return bool
     * Toggles between having dev tools on or off.
     */
    toggleDevtools() {
        this.config.devTools = !this.config.devTools;
        this.save();
        return this.config.devTools;
    }

    /*
     * getInterface()
     * @return bool
     * Determines if dev tools are opened.
     */
    getDevTools() {
        return this.config.devTools;
    }

    /*
     * setProfile(id)
     * @param integer id
     * @return integer
     * Sets the profile currently being used in OJD
     */
    setProfile(id) {
        this.config.profile = parseInt(id, 10);
        this.save();
        return this.config.profile;
    }

    /*
     * getProfile()
     * @return integer
     * Returns the profile id set.
     */
    getProfile() {
        return this.config.profile;
    }

    /*
     * setUserThemeDirectory(id)
     * @param string directory
     * @return string
     * Sets the custom theme directory.
     */
    setUserThemeDirectory(directory) {
        this.config.themeUserDirectory = directory;
        this.save();
        return this.config.themeUserDirectory;
    }

    /*
     * getUserThemeDirectory()
     * @return string
     * Returns the current custom theme directory.
     */
    getUserThemeDirectory() {
        return this.config.themeUserDirectory;
    }

    /*
     * save()
     * @return NULL
     * Saves config object
     */
    save() {
        this.store.set('config', this.config);
    }

    /*
     * reset()
     * @return bool
     * Alias of init.
     */
    reset() {
        return this.init(true);
    }


}

module.exports.Config = Config;