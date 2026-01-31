import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

/**
 * Unified input state from any input source
 */
export interface InputState {
  moveX: number; // -1 (left) to 1 (right)
  moveY: number; // -1 (up) to 1 (down)
  jump: boolean; // Jump button held
  jumpPressed: boolean; // Jump button just pressed this frame
  action: boolean; // Action button held
  actionPressed: boolean; // Action button just pressed this frame
  pause: boolean; // Pause button pressed
}

export type InputMethod = 'keyboard' | 'touch' | 'gamepad';

/**
 * Key binding configuration
 */
export interface KeyBindings {
  moveLeft: number[];
  moveRight: number[];
  moveUp: number[];
  moveDown: number[];
  jump: number[];
  action: number[];
  pause: number[];
}

/**
 * Input sensitivity settings
 */
export interface InputSettings {
  deadZone: number; // 0-1, ignore input below this threshold
  sensitivity: number; // Multiplier for analog input
  joystickSize: number; // Size of virtual joystick in pixels
  buttonSize: number; // Size of virtual buttons in pixels
}

const DEFAULT_KEY_BINDINGS: KeyBindings = {
  moveLeft: [
    Phaser.Input.Keyboard.KeyCodes.LEFT,
    Phaser.Input.Keyboard.KeyCodes.A,
  ],
  moveRight: [
    Phaser.Input.Keyboard.KeyCodes.RIGHT,
    Phaser.Input.Keyboard.KeyCodes.D,
  ],
  moveUp: [
    Phaser.Input.Keyboard.KeyCodes.UP,
    Phaser.Input.Keyboard.KeyCodes.W,
  ],
  moveDown: [
    Phaser.Input.Keyboard.KeyCodes.DOWN,
    Phaser.Input.Keyboard.KeyCodes.S,
  ],
  jump: [
    Phaser.Input.Keyboard.KeyCodes.SPACE,
    Phaser.Input.Keyboard.KeyCodes.UP,
    Phaser.Input.Keyboard.KeyCodes.W,
  ],
  action: [
    Phaser.Input.Keyboard.KeyCodes.X,
    Phaser.Input.Keyboard.KeyCodes.SHIFT,
  ],
  pause: [
    Phaser.Input.Keyboard.KeyCodes.ESC,
    Phaser.Input.Keyboard.KeyCodes.P,
  ],
};

const DEFAULT_SETTINGS: InputSettings = {
  deadZone: 0.15,
  sensitivity: 1.0,
  joystickSize: 80,
  buttonSize: 50,
};

/**
 * Cross-platform input manager supporting keyboard, gamepad, and touch
 */
export class InputManager {
  private scene: Phaser.Scene;

  // Settings
  private bindings: KeyBindings;
  private settings: InputSettings;

  // Keyboard
  private keys: Map<number, Phaser.Input.Keyboard.Key> = new Map();

  // Gamepad
  private gamepad: Phaser.Input.Gamepad.Gamepad | null = null;

  // Touch / Virtual controls
  private joystickContainer!: Phaser.GameObjects.Container;
  private joystickBase!: Phaser.GameObjects.Arc;
  private joystickThumb!: Phaser.GameObjects.Arc;
  private jumpButton!: Phaser.GameObjects.Arc;
  private jumpButtonBg!: Phaser.GameObjects.Arc;
  private actionButton!: Phaser.GameObjects.Arc;
  private actionButtonBg!: Phaser.GameObjects.Arc;

  private joystickPointer: Phaser.Input.Pointer | null = null;
  private joystickOrigin = { x: 0, y: 0 };
  private joystickVector = { x: 0, y: 0 };

  private touchJumpHeld = false;
  private touchJumpPressed = false;
  private touchActionHeld = false;
  private touchActionPressed = false;

  // State tracking
  private inputMethod: InputMethod = 'keyboard';
  private previousState: InputState;
  private isMobile: boolean;
  private virtualControlsVisible = false;

  constructor(scene: Phaser.Scene, settings?: Partial<InputSettings>, bindings?: Partial<KeyBindings>) {
    this.scene = scene;
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    this.bindings = { ...DEFAULT_KEY_BINDINGS, ...bindings };
    this.isMobile = this.detectMobile();

    this.previousState = this.createEmptyState();
  }

  /**
   * Initialize input systems - call in scene's create()
   */
  create(): void {
    this.setupKeyboard();
    this.setupGamepad();

    if (this.isMobile) {
      this.createVirtualControls();
      this.showVirtualControls();
    } else {
      this.createVirtualControls();
      this.hideVirtualControls();
    }

    this.setupTouchInput();
  }

  /**
   * Detect if running on mobile device
   */
  private detectMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints > 0 && window.matchMedia('(pointer: coarse)').matches);
  }

  /**
   * Create empty input state
   */
  private createEmptyState(): InputState {
    return {
      moveX: 0,
      moveY: 0,
      jump: false,
      jumpPressed: false,
      action: false,
      actionPressed: false,
      pause: false,
    };
  }

  // ==================== Keyboard ====================

  private setupKeyboard(): void {
    if (!this.scene.input.keyboard) return;

    // Register all bound keys
    const allKeyCodes = new Set<number>();

    Object.values(this.bindings).forEach(codes => {
      codes.forEach(code => allKeyCodes.add(code));
    });

    allKeyCodes.forEach(code => {
      const key = this.scene.input.keyboard!.addKey(code);
      this.keys.set(code, key);
    });
  }

  /**
   * Check if any key in binding is down
   */
  private isKeyDown(bindingName: keyof KeyBindings): boolean {
    const codes = this.bindings[bindingName];
    return codes.some(code => {
      const key = this.keys.get(code);
      return key?.isDown ?? false;
    });
  }

  /**
   * Check if any key in binding was just pressed
   */
  private isKeyJustDown(bindingName: keyof KeyBindings): boolean {
    const codes = this.bindings[bindingName];
    return codes.some(code => {
      const key = this.keys.get(code);
      return key ? Phaser.Input.Keyboard.JustDown(key) : false;
    });
  }

  /**
   * Get keyboard input state
   */
  private getKeyboardState(): InputState {
    let moveX = 0;
    let moveY = 0;

    if (this.isKeyDown('moveLeft')) moveX -= 1;
    if (this.isKeyDown('moveRight')) moveX += 1;
    if (this.isKeyDown('moveUp')) moveY -= 1;
    if (this.isKeyDown('moveDown')) moveY += 1;

    return {
      moveX,
      moveY,
      jump: this.isKeyDown('jump'),
      jumpPressed: this.isKeyJustDown('jump'),
      action: this.isKeyDown('action'),
      actionPressed: this.isKeyJustDown('action'),
      pause: this.isKeyJustDown('pause'),
    };
  }

  // ==================== Gamepad ====================

  private setupGamepad(): void {
    if (!this.scene.input.gamepad) return;

    this.scene.input.gamepad.once('connected', (pad: Phaser.Input.Gamepad.Gamepad) => {
      this.gamepad = pad;
      this.inputMethod = 'gamepad';
      this.hideVirtualControls();
    });

    this.scene.input.gamepad.on('disconnected', () => {
      this.gamepad = null;
      if (this.isMobile) {
        this.showVirtualControls();
      }
    });

    // Check if gamepad already connected
    if (this.scene.input.gamepad.total > 0) {
      this.gamepad = this.scene.input.gamepad.getPad(0);
    }
  }

  /**
   * Get gamepad input state
   */
  private getGamepadState(): InputState | null {
    if (!this.gamepad) return null;

    const leftStickX = this.gamepad.leftStick.x;
    const leftStickY = this.gamepad.leftStick.y;

    // Apply dead zone
    const moveX = Math.abs(leftStickX) > this.settings.deadZone
      ? leftStickX * this.settings.sensitivity
      : 0;
    const moveY = Math.abs(leftStickY) > this.settings.deadZone
      ? leftStickY * this.settings.sensitivity
      : 0;

    // Gamepad buttons (standard mapping)
    // A/Cross = 0, B/Circle = 1, X/Square = 2, Y/Triangle = 3
    // Start = 9
    const jumpButton = this.gamepad.buttons[0]; // A
    const actionButton = this.gamepad.buttons[2]; // X
    const startButton = this.gamepad.buttons[9]; // Start

    return {
      moveX: Phaser.Math.Clamp(moveX, -1, 1),
      moveY: Phaser.Math.Clamp(moveY, -1, 1),
      jump: jumpButton?.pressed ?? false,
      jumpPressed: jumpButton ? this.wasButtonJustPressed(0) : false,
      action: actionButton?.pressed ?? false,
      actionPressed: actionButton ? this.wasButtonJustPressed(2) : false,
      pause: startButton ? this.wasButtonJustPressed(9) : false,
    };
  }

  private gamepadButtonStates: Map<number, boolean> = new Map();

  private wasButtonJustPressed(buttonIndex: number): boolean {
    if (!this.gamepad) return false;

    const button = this.gamepad.buttons[buttonIndex];
    const isPressed = button?.pressed ?? false;
    const wasPressed = this.gamepadButtonStates.get(buttonIndex) ?? false;

    this.gamepadButtonStates.set(buttonIndex, isPressed);

    return isPressed && !wasPressed;
  }

  // ==================== Touch / Virtual Controls ====================

  private createVirtualControls(): void {
    const { joystickSize, buttonSize } = this.settings;
    const padding = 20;

    // Create container for all virtual controls
    this.joystickContainer = this.scene.add.container(0, 0);
    this.joystickContainer.setDepth(1000);
    this.joystickContainer.setScrollFactor(0);

    // Joystick (bottom left)
    const joystickX = padding + joystickSize / 2;
    const joystickY = GAME_HEIGHT - padding - joystickSize / 2;

    this.joystickBase = this.scene.add.circle(joystickX, joystickY, joystickSize / 2, 0x333333, 0.5);
    this.joystickBase.setStrokeStyle(2, 0x666666);

    this.joystickThumb = this.scene.add.circle(joystickX, joystickY, joystickSize / 4, 0x888888, 0.8);
    this.joystickThumb.setStrokeStyle(2, 0xaaaaaa);

    this.joystickContainer.add([this.joystickBase, this.joystickThumb]);

    // Jump button (bottom right)
    const jumpX = GAME_WIDTH - padding - buttonSize / 2;
    const jumpY = GAME_HEIGHT - padding - buttonSize / 2;

    this.jumpButtonBg = this.scene.add.circle(jumpX, jumpY, buttonSize / 2, 0x333333, 0.5);
    this.jumpButtonBg.setStrokeStyle(2, 0x00ff88);

    this.jumpButton = this.scene.add.circle(jumpX, jumpY, buttonSize / 2 - 5, 0x00aa66, 0.8);

    // Jump label
    const jumpLabel = this.scene.add.text(jumpX, jumpY, 'JUMP', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.joystickContainer.add([this.jumpButtonBg, this.jumpButton, jumpLabel]);

    // Action button (above jump button)
    const actionX = jumpX - buttonSize - 10;
    const actionY = jumpY;

    this.actionButtonBg = this.scene.add.circle(actionX, actionY, buttonSize / 2 * 0.8, 0x333333, 0.5);
    this.actionButtonBg.setStrokeStyle(2, 0xff6688);

    this.actionButton = this.scene.add.circle(actionX, actionY, buttonSize / 2 * 0.8 - 5, 0xaa4466, 0.8);

    const actionLabel = this.scene.add.text(actionX, actionY, 'ACT', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.joystickContainer.add([this.actionButtonBg, this.actionButton, actionLabel]);
  }

  private setupTouchInput(): void {
    const { joystickSize, buttonSize } = this.settings;

    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.inputMethod = 'touch';

      // Check if touching joystick area (left half of screen, bottom area)
      if (pointer.x < GAME_WIDTH / 2 && pointer.y > GAME_HEIGHT / 2) {
        if (!this.joystickPointer) {
          this.joystickPointer = pointer;
          this.joystickOrigin = { x: pointer.x, y: pointer.y };

          // Move joystick base to touch position
          if (this.virtualControlsVisible) {
            this.joystickBase.setPosition(pointer.x, pointer.y);
            this.joystickThumb.setPosition(pointer.x, pointer.y);
          }
        }
      }

      // Check jump button
      const jumpDist = Phaser.Math.Distance.Between(
        pointer.x, pointer.y,
        this.jumpButton.x, this.jumpButton.y
      );
      if (jumpDist < buttonSize / 2) {
        this.touchJumpHeld = true;
        this.touchJumpPressed = true;
        this.jumpButton.setFillStyle(0x00ff88);
      }

      // Check action button
      const actionDist = Phaser.Math.Distance.Between(
        pointer.x, pointer.y,
        this.actionButton.x, this.actionButton.y
      );
      if (actionDist < buttonSize / 2) {
        this.touchActionHeld = true;
        this.touchActionPressed = true;
        this.actionButton.setFillStyle(0xff88aa);
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.joystickPointer && pointer.id === this.joystickPointer.id) {
        this.updateJoystick(pointer);
      }
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      // Release joystick
      if (this.joystickPointer && pointer.id === this.joystickPointer.id) {
        this.joystickPointer = null;
        this.joystickVector = { x: 0, y: 0 };

        // Reset joystick position
        if (this.virtualControlsVisible) {
          const { joystickSize } = this.settings;
          const padding = 20;
          const defaultX = padding + joystickSize / 2;
          const defaultY = GAME_HEIGHT - padding - joystickSize / 2;
          this.joystickBase.setPosition(defaultX, defaultY);
          this.joystickThumb.setPosition(defaultX, defaultY);
        }
      }

      // Release buttons (check by touch position)
      const jumpDist = Phaser.Math.Distance.Between(
        pointer.x, pointer.y,
        this.jumpButton.x, this.jumpButton.y
      );
      if (jumpDist < this.settings.buttonSize) {
        this.touchJumpHeld = false;
        this.jumpButton.setFillStyle(0x00aa66);
      }

      const actionDist = Phaser.Math.Distance.Between(
        pointer.x, pointer.y,
        this.actionButton.x, this.actionButton.y
      );
      if (actionDist < this.settings.buttonSize) {
        this.touchActionHeld = false;
        this.actionButton.setFillStyle(0xaa4466);
      }
    });
  }

  private updateJoystick(pointer: Phaser.Input.Pointer): void {
    const maxDistance = this.settings.joystickSize / 2;

    const dx = pointer.x - this.joystickOrigin.x;
    const dy = pointer.y - this.joystickOrigin.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Clamp to max distance
    const clampedDistance = Math.min(distance, maxDistance);
    const angle = Math.atan2(dy, dx);

    // Calculate normalized vector
    const normalizedDistance = clampedDistance / maxDistance;
    this.joystickVector = {
      x: Math.cos(angle) * normalizedDistance,
      y: Math.sin(angle) * normalizedDistance,
    };

    // Apply dead zone
    if (normalizedDistance < this.settings.deadZone) {
      this.joystickVector = { x: 0, y: 0 };
    }

    // Update thumb position
    if (this.virtualControlsVisible) {
      this.joystickThumb.setPosition(
        this.joystickOrigin.x + Math.cos(angle) * clampedDistance,
        this.joystickOrigin.y + Math.sin(angle) * clampedDistance
      );
    }
  }

  /**
   * Get touch input state
   */
  private getTouchState(): InputState {
    const jumpPressed = this.touchJumpPressed;
    const actionPressed = this.touchActionPressed;

    // Clear "just pressed" flags after reading
    this.touchJumpPressed = false;
    this.touchActionPressed = false;

    return {
      moveX: this.joystickVector.x * this.settings.sensitivity,
      moveY: this.joystickVector.y * this.settings.sensitivity,
      jump: this.touchJumpHeld,
      jumpPressed,
      action: this.touchActionHeld,
      actionPressed,
      pause: false, // Pause handled separately for touch
    };
  }

  // ==================== Virtual Controls Visibility ====================

  showVirtualControls(): void {
    if (!this.joystickContainer) return;
    this.joystickContainer.setVisible(true);
    this.virtualControlsVisible = true;
  }

  hideVirtualControls(): void {
    if (!this.joystickContainer) return;
    this.joystickContainer.setVisible(false);
    this.virtualControlsVisible = false;
  }

  toggleVirtualControls(): void {
    if (this.virtualControlsVisible) {
      this.hideVirtualControls();
    } else {
      this.showVirtualControls();
    }
  }

  // ==================== Public API ====================

  /**
   * Get current input state from all sources
   * Call this once per frame in update()
   */
  getInputState(): InputState {
    // Check gamepad first (if connected and has input)
    const gamepadState = this.getGamepadState();
    if (gamepadState && (
      Math.abs(gamepadState.moveX) > this.settings.deadZone ||
      Math.abs(gamepadState.moveY) > this.settings.deadZone ||
      gamepadState.jump ||
      gamepadState.action
    )) {
      this.inputMethod = 'gamepad';
      this.previousState = gamepadState;
      return gamepadState;
    }

    // Check keyboard
    const keyboardState = this.getKeyboardState();
    if (
      keyboardState.moveX !== 0 ||
      keyboardState.moveY !== 0 ||
      keyboardState.jump ||
      keyboardState.action ||
      keyboardState.pause
    ) {
      this.inputMethod = 'keyboard';
      if (!this.isMobile) {
        this.hideVirtualControls();
      }
      this.previousState = keyboardState;
      return keyboardState;
    }

    // Fall back to touch
    const touchState = this.getTouchState();
    if (
      Math.abs(touchState.moveX) > this.settings.deadZone ||
      Math.abs(touchState.moveY) > this.settings.deadZone ||
      touchState.jump ||
      touchState.action
    ) {
      this.inputMethod = 'touch';
      this.showVirtualControls();
      this.previousState = touchState;
      return touchState;
    }

    // No input - return empty state but preserve pause from keyboard
    return {
      ...this.createEmptyState(),
      pause: keyboardState.pause,
    };
  }

  /**
   * Get current input method
   */
  getInputMethod(): InputMethod {
    return this.inputMethod;
  }

  /**
   * Check if device is mobile
   */
  getIsMobile(): boolean {
    return this.isMobile;
  }

  /**
   * Update key bindings
   */
  setKeyBindings(bindings: Partial<KeyBindings>): void {
    this.bindings = { ...this.bindings, ...bindings };

    // Re-register keys
    this.keys.clear();
    this.setupKeyboard();

    // Save to localStorage
    localStorage.setItem('spike-rivals-keybindings', JSON.stringify(this.bindings));
  }

  /**
   * Get current key bindings
   */
  getKeyBindings(): KeyBindings {
    return { ...this.bindings };
  }

  /**
   * Load key bindings from localStorage
   */
  loadKeyBindings(): void {
    const saved = localStorage.getItem('spike-rivals-keybindings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.bindings = { ...DEFAULT_KEY_BINDINGS, ...parsed };
        this.keys.clear();
        this.setupKeyboard();
      } catch {
        // Use defaults on parse error
      }
    }
  }

  /**
   * Reset key bindings to defaults
   */
  resetKeyBindings(): void {
    this.bindings = { ...DEFAULT_KEY_BINDINGS };
    this.keys.clear();
    this.setupKeyboard();
    localStorage.removeItem('spike-rivals-keybindings');
  }

  /**
   * Update input settings
   */
  setSettings(settings: Partial<InputSettings>): void {
    this.settings = { ...this.settings, ...settings };
    localStorage.setItem('spike-rivals-input-settings', JSON.stringify(this.settings));
  }

  /**
   * Get current settings
   */
  getSettings(): InputSettings {
    return { ...this.settings };
  }

  /**
   * Load settings from localStorage
   */
  loadSettings(): void {
    const saved = localStorage.getItem('spike-rivals-input-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.settings = { ...DEFAULT_SETTINGS, ...parsed };
      } catch {
        // Use defaults on parse error
      }
    }
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    this.scene.input.off('pointerdown');
    this.scene.input.off('pointermove');
    this.scene.input.off('pointerup');

    if (this.joystickContainer) {
      this.joystickContainer.destroy();
    }

    this.keys.clear();
    this.gamepadButtonStates.clear();
  }
}
