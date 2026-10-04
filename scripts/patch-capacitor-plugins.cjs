const fs = require('fs');
const path = require('path');

console.log('🔧 Running Capacitor 8.5 Swift SPM compatibility patch...');

// Helper to replace all call.reject(...) calls line-by-line safely
function replaceCallRejects(filePath) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.split('\n').map(line => {
      if (line.includes('call.reject(')) {
        const indent = line.match(/^\s*/)[0];
        const isReturn = line.includes('return call.reject');
        return isReturn ? `${indent}call.errorHandler?(nil); return` : `${indent}call.errorHandler?(nil)`;
      }
      if (line.includes('call.unimplemented(')) {
        const indent = line.match(/^\s*/)[0];
        return `${indent}call.errorHandler?(nil)`;
      }
      return line;
    }).join('\n');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ Safely patched call.reject in ${path.basename(filePath)}`);
  }
}

// 1. Patch @capacitor/share
const sharePluginPath = path.join(__dirname, '..', 'node_modules', '@capacitor', 'share', 'ios', 'Sources', 'SharePlugin', 'SharePlugin.swift');
if (fs.existsSync(sharePluginPath)) {
  const shareContent = `import Foundation
import Capacitor
import UIKit

@objc(SharePlugin)
public class SharePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SharePlugin"
    public let jsName = "Share"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "canShare", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "share", returnType: CAPPluginReturnPromise)
    ]

    @objc func canShare(_ call: CAPPluginCall) {
        call.resolve([
            "value": true
        ])
    }

    @objc func share(_ call: CAPPluginCall) {
        var items = [Any]()

        if let text = call.options["text"] as? String {
            items.append(text)
        }

        if let url = call.options["url"] as? String, let urlObj = URL(string: url) {
            items.append(urlObj)
        }

        let title = call.options["title"] as? String

        if let files = call.options["files"] as? [Any] {
            files.forEach { file in
                if let url = file as? String, let fileUrl = URL(string: url) {
                    items.append(fileUrl)
                }
            }
        }

        if items.count == 0 {
            call.errorHandler?(nil)
            return
        }

        DispatchQueue.main.async {
            let actionController = UIActivityViewController(activityItems: items, applicationActivities: nil)

            if title != nil {
                actionController.setValue(title, forKey: "subject")
            }

            actionController.completionWithItemsHandler = { (activityType, completed, _ returnedItems, activityError) in
                if activityError != nil {
                    call.errorHandler?(nil)
                    return
                }

                if completed {
                    call.resolve([
                        "activityType": activityType?.rawValue ?? ""
                    ])
                } else {
                    call.errorHandler?(nil)
                }
            }

            if let rootVC = UIApplication.shared.windows.first?.rootViewController {
                var topVC = rootVC
                while let presented = topVC.presentedViewController {
                    topVC = presented
                }
                topVC.present(actionController, animated: true)
            }
        }
    }
}
`;
  fs.writeFileSync(sharePluginPath, shareContent, 'utf8');
  console.log('  ✅ Patched SharePlugin.swift');
}

// 2. Patch @capacitor/preferences
const prefPluginPath = path.join(__dirname, '..', 'node_modules', '@capacitor', 'preferences', 'ios', 'Sources', 'PreferencesPlugin', 'PreferencesPlugin.swift');
if (fs.existsSync(prefPluginPath)) {
  const prefContent = `import Foundation
import Capacitor

@objc(PreferencesPlugin)
public class PreferencesPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PreferencesPlugin"
    public let jsName = "Preferences"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "configure", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "remove", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "keys", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clear", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "migrate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "removeOld", returnType: CAPPluginReturnPromise)
    ]
    private var preferences = Preferences(with: PreferencesConfiguration())

    @objc func configure(_ call: CAPPluginCall) {
        let group = call.options["group"] as? String
        let configuration: PreferencesConfiguration

        if let group = group {
            if group == "NativeStorage" {
                configuration = PreferencesConfiguration(for: .cordovaNativeStorage)
            } else {
                configuration = PreferencesConfiguration(for: .named(group))
            }
        } else {
            configuration = PreferencesConfiguration()
        }

        preferences = Preferences(with: configuration)
        call.resolve()
    }

    @objc func get(_ call: CAPPluginCall) {
        guard let key = call.options["key"] as? String else {
            call.errorHandler?(nil)
            return
        }

        let value = preferences.get(by: key)

        call.resolve([
            "value": value as Any
        ])
    }

    @objc func set(_ call: CAPPluginCall) {
        guard let key = call.options["key"] as? String else {
            call.errorHandler?(nil)
            return
        }
        let value = (call.options["value"] as? String) ?? ""

        preferences.set(value, for: key)
        call.resolve()
    }

    @objc func remove(_ call: CAPPluginCall) {
        guard let key = call.options["key"] as? String else {
            call.errorHandler?(nil)
            return
        }

        preferences.remove(by: key)
        call.resolve()
    }

    @objc func keys(_ call: CAPPluginCall) {
        let keys = preferences.keys()

        call.resolve([
            "keys": keys
        ])
    }

    @objc func clear(_ call: CAPPluginCall) {
        preferences.removeAll()
        call.resolve()
    }

    @objc func migrate(_ call: CAPPluginCall) {
        var migrated: [String] = []
        var existing: [String] = []
        let oldPrefix = "_cap_"
        let oldKeys = UserDefaults.standard.dictionaryRepresentation().keys.filter { $0.hasPrefix(oldPrefix) }

        for oldKey in oldKeys {
            let key = String(oldKey.dropFirst(oldPrefix.count))
            let value = UserDefaults.standard.string(forKey: oldKey) ?? ""
            let currentValue = preferences.get(by: key)

            if currentValue == nil {
                preferences.set(value, for: key)
                migrated.append(key)
            } else {
                existing.append(key)
            }
        }

        call.resolve([
            "migrated": migrated,
            "existing": existing
        ])
    }

    @objc func removeOld(_ call: CAPPluginCall) {
        let oldPrefix = "_cap_"
        let oldKeys = UserDefaults.standard.dictionaryRepresentation().keys.filter { $0.hasPrefix(oldPrefix) }
        for oldKey in oldKeys {
            UserDefaults.standard.removeObject(forKey: oldKey)
        }
        call.resolve()
    }
}
`;
  fs.writeFileSync(prefPluginPath, prefContent, 'utf8');
  console.log('  ✅ Patched PreferencesPlugin.swift');
}

// 3. Patch @capacitor/push-notifications
const pushHandlerPath = path.join(__dirname, '..', 'node_modules', '@capacitor', 'push-notifications', 'ios', 'Sources', 'PushNotificationsPlugin', 'PushNotificationsHandler.swift');
if (fs.existsSync(pushHandlerPath)) {
  let content = fs.readFileSync(pushHandlerPath, 'utf8');
  content = content.replace(/self\.plugin\?\.getConfig\(\)\.getArray\("presentationOptions"\) as\? \[String\]/g, '(self.plugin?.getConfig().getConfigJSON()["presentationOptions"] as? [String])');
  content = content.replace(/JSTypes\.coerceDictionaryToJSObject\(request\.content\.userInfo\) \?\? \[:\]/g, '((request.content.userInfo as? JSObject) ?? [:])');
  fs.writeFileSync(pushHandlerPath, content, 'utf8');
  console.log('  ✅ Patched PushNotificationsHandler.swift');
}

const pushPluginPath = path.join(__dirname, '..', 'node_modules', '@capacitor', 'push-notifications', 'ios', 'Sources', 'PushNotificationsPlugin', 'PushNotificationsPlugin.swift');
if (fs.existsSync(pushPluginPath)) {
  const pushContent = `import Foundation
import Capacitor
import UserNotifications

@objc(PushNotificationsPlugin)
public class PushNotificationsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PushNotificationsPlugin"
    public let jsName = "PushNotifications"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "register", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getDeliveredNotifications", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "removeDeliveredNotifications", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "removeAllDeliveredNotifications", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "createChannel", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deleteChannel", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "listChannels", returnType: CAPPluginReturnPromise)
    ]

    private let notificationDelegateHandler = PushNotificationsHandler()
    private var appDelegateRegistrationCalled = false

    override public func load() {
        self.notificationDelegateHandler.plugin = self
        NotificationCenter.default.addObserver(self, selector: #selector(self.handleDidRegisterForRemoteNotificationsWithDeviceToken(notification:)), name: Notification.Name.capacitorDidRegisterForRemoteNotifications, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(self.handleDidFailToRegisterForRemoteNotificationsWithError(notification:)), name: Notification.Name.capacitorDidFailToRegisterForRemoteNotifications, object: nil)
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    @objc func register(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            UIApplication.shared.registerForRemoteNotifications()
        }
        call.resolve()
    }

    @objc override public func requestPermissions(_ call: CAPPluginCall) {
        self.notificationDelegateHandler.requestPermissions { (granted, error) in
            if error != nil {
                call.errorHandler?(nil)
                return
            }

            if granted {
                call.resolve(["receive": "granted"])
            } else {
                call.resolve(["receive": "denied"])
            }
        }
    }

    @objc override public func checkPermissions(_ call: CAPPluginCall) {
        self.notificationDelegateHandler.checkPermissions { (status) in
            var result: String
            switch status {
            case .authorized, .provisional:
                result = "granted"
            case .denied:
                result = "denied"
            case .ephemeral:
                result = "granted"
            case .notDetermined:
                result = "prompt"
            @unknown default:
                result = "prompt"
            }
            call.resolve(["receive": result])
        }
    }

    @objc func handleDidRegisterForRemoteNotificationsWithDeviceToken(notification: NSNotification) {
        appDelegateRegistrationCalled = true
        if let deviceToken = notification.object as? Data {
            let deviceTokenString = deviceToken.reduce("", {$0 + String(format: "%02X", $1)})
            notifyListeners("registration", data: [
                "value": deviceTokenString
            ])
        } else if let stringToken = notification.object as? String {
            notifyListeners("registration", data: [
                "value": stringToken
            ])
        }
    }

    @objc func handleDidFailToRegisterForRemoteNotificationsWithError(notification: NSNotification) {
        appDelegateRegistrationCalled = true
        guard let error = notification.object as? Error else {
            return
        }
        notifyListeners("registrationError", data: [
            "error": error.localizedDescription
        ])
    }

    @objc func getDeliveredNotifications(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().getDeliveredNotifications(completionHandler: { (notifications) in
            let ret = notifications.map({ (notification) -> [String: Any] in
                return self.notificationDelegateHandler.makeNotificationRequestJSObject(notification.request)
            })
            call.resolve([
                "notifications": ret
            ])
        })
    }

    @objc func removeDeliveredNotifications(_ call: CAPPluginCall) {
        guard let notifications = call.options["notifications"] as? [[String: Any]] else {
            call.errorHandler?(nil)
            return
        }

        let ids = notifications.map { $0["id"] as? String ?? "" }
        UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: ids)
        call.resolve()
    }

    @objc func removeAllDeliveredNotifications(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().removeAllDeliveredNotifications()
        DispatchQueue.main.async(execute: {
            UIApplication.shared.applicationIconBadgeNumber = 0
        })
        call.resolve()
    }

    @objc func createChannel(_ call: CAPPluginCall) {
        call.errorHandler?(nil)
    }

    @objc func deleteChannel(_ call: CAPPluginCall) {
        call.errorHandler?(nil)
    }

    @objc func listChannels(_ call: CAPPluginCall) {
        call.errorHandler?(nil)
    }
}
`;
  fs.writeFileSync(pushPluginPath, pushContent, 'utf8');
  console.log('  ✅ Patched PushNotificationsPlugin.swift');
}

// 4. Patch @capacitor/app safely
replaceCallRejects(path.join(__dirname, '..', 'node_modules', '@capacitor', 'app', 'ios', 'Sources', 'AppPlugin', 'AppPlugin.swift'));

// 5. Patch @capacitor/filesystem
const legacyFsPath = path.join(__dirname, '..', 'node_modules', '@capacitor', 'filesystem', 'ios', 'Sources', 'FilesystemPlugin', 'LegacyFilesystemImplementation.swift');
if (fs.existsSync(legacyFsPath)) {
  const legacyContent = `import Foundation
import Capacitor

@objc public class LegacyFilesystemImplementation: NSObject {
    public typealias ProgressEmitter = (_ bytes: Int64, _ contentLength: Int64) -> Void

    @objc public func downloadFile(call: CAPPluginCall, emitter: @escaping ProgressEmitter, config: InstanceConfiguration?) throws {
        call.errorHandler?(nil)
    }
}
`;
  fs.writeFileSync(legacyFsPath, legacyContent, 'utf8');
  console.log('  ✅ Replaced LegacyFilesystemImplementation.swift with clean stub');
}

const fsPluginPath = path.join(__dirname, '..', 'node_modules', '@capacitor', 'filesystem', 'ios', 'Sources', 'FilesystemPlugin', 'FilesystemPlugin.swift');
if (fs.existsSync(fsPluginPath)) {
  const fsPluginContent = `import Foundation
import Capacitor
import IONFilesystemLib

typealias FileService = any IONFILEDirectoryManager & IONFILEFileManager

@objc(FilesystemPlugin)
public class FilesystemPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FilesystemPlugin"
    public let jsName = "Filesystem"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "readFile", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readFileInChunks", returnType: CAPPluginReturnCallback),
        CAPPluginMethod(name: "writeFile", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "appendFile", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deleteFile", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "mkdir", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "rmdir", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readdir", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getUri", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stat", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "rename", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "copy", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "downloadFile", returnType: CAPPluginReturnPromise)
    ]

    private let legacyImplementation = LegacyFilesystemImplementation()
    private var fileService: FileService?

    override public func load() {
        self.fileService = IONFILEManager()
    }

    func getService() -> Result<FileService, FilesystemError> {
        if fileService == nil { load() }
        return fileService.map(Result.success) ?? .failure(.bridgeNotInitialised)
    }

    @objc override public func checkPermissions(_ call: CAPPluginCall) {
        call.handlePermissionSuccess()
    }

    @objc override public func requestPermissions(_ call: CAPPluginCall) {
        call.handlePermissionSuccess()
    }
}

// MARK: - Public API Methods
private extension FilesystemPlugin {
    @objc func readFile(_ call: CAPPluginCall) {
        let encoding = call.getEncoding(Constants.MethodParameter.encoding)
        let offset = (call.options[Constants.MethodParameter.offset] as? Int) ?? 0
        let length = (call.options[Constants.MethodParameter.length] as? Int) ?? -1
        performSinglePathOperation(call) {
            .readFile(url: $0, encoding: encoding, offset: offset, length: length)
        }
    }

    @objc func readFileInChunks(_ call: CAPPluginCall) {
        let encoding = call.getEncoding(Constants.MethodParameter.encoding)
        guard let chunkSize = call.options[Constants.MethodParameter.chunkSize] as? Int else {
            return call.handleError(.invalidInput(method: call.getIONFileMethod()))
        }
        let offset = (call.options[Constants.MethodParameter.offset] as? Int) ?? 0
        let length = (call.options[Constants.MethodParameter.length] as? Int) ?? -1
        performSinglePathOperation(call) {
            .readFileInChunks(url: $0, encoding: encoding, chunkSize: chunkSize, offset: offset, length: length)
        }
    }

    @objc func writeFile(_ call: CAPPluginCall) {
        guard let encodingMapper = call.getEncodingMapper() else {
            return call.handleError(.invalidInput(method: call.getIONFileMethod()))
        }
        let recursive = (call.options[Constants.MethodParameter.recursive] as? Bool) ?? false

        performSinglePathOperation(call) {
            .write(url: $0, encodingMapper: encodingMapper, recursive: recursive)
        }
    }

    @objc func appendFile(_ call: CAPPluginCall) {
        guard let encodingMapper = call.getEncodingMapper() else {
            return call.handleError(.invalidInput(method: call.getIONFileMethod()))
        }
        let recursive = (call.options[Constants.MethodParameter.recursive] as? Bool) ?? false

        performSinglePathOperation(call) {
            .append(url: $0, encodingMapper: encodingMapper, recursive: recursive)
        }
    }

    @objc func deleteFile(_ call: CAPPluginCall) {
        performSinglePathOperation(call) {
            .delete(url: $0)
        }
    }

    @objc func mkdir(_ call: CAPPluginCall) {
        let recursive = (call.options[Constants.MethodParameter.recursive] as? Bool) ?? false

        performSinglePathOperation(call) {
            .mkdir(url: $0, recursive: recursive)
        }
    }

    @objc func rmdir(_ call: CAPPluginCall) {
        let recursive = (call.options[Constants.MethodParameter.recursive] as? Bool) ?? false

        performSinglePathOperation(call) {
            .rmdir(url: $0, recursive: recursive)
        }
    }

    @objc func readdir(_ call: CAPPluginCall) {
        performSinglePathOperation(call) {
            .readdir(url: $0)
        }
    }

    @objc func stat(_ call: CAPPluginCall) {
        performSinglePathOperation(call) {
            .stat(url: $0)
        }
    }

    @objc func getUri(_ call: CAPPluginCall) {
        performSinglePathOperation(call) {
            .getUri(url: $0)
        }
    }

    @objc func rename(_ call: CAPPluginCall) {
        performDualPathOperation(call) {
            .rename(source: $0, destination: $1)
        }
    }

    @objc func copy(_ call: CAPPluginCall) {
        performDualPathOperation(call) {
            .copy(source: $0, destination: $1)
        }
    }

    @available(*, deprecated, message: "Use @capacitor/file-transfer plugin instead.")
    @objc func downloadFile(_ call: CAPPluginCall) {
        call.errorHandler?(nil)
    }
}

// MARK: - Operation Execution
private extension FilesystemPlugin {
    func performSinglePathOperation(_ call: CAPPluginCall, operationBuilder: (URL) -> FilesystemOperation) {
        executeOperation(call) { service in
            FilesystemLocationResolver(service: service)
                .resolveSinglePath(from: call)
                .map { operationBuilder($0) }
        }
    }

    func performDualPathOperation(_ call: CAPPluginCall, operationBuilder: (URL, URL) -> FilesystemOperation) {
        executeOperation(call) { service in
            FilesystemLocationResolver(service: service)
                .resolveDualPaths(from: call)
                .map { operationBuilder($0.source, $0.destination) }
        }
    }

    func executeOperation(_ call: CAPPluginCall, operationProvider: (FileService) -> Result<FilesystemOperation, FilesystemError>) {
        switch getService() {
        case .success(let service):
            switch operationProvider(service) {
            case .success(let operation):
                let executor = FilesystemOperationExecutor(service: service)
                executor.execute(operation, call)
            case .failure(let error):
                call.handleError(error)
            }
        case .failure(let error):
            call.handleError(error)
        }
    }
}
`;
  fs.writeFileSync(fsPluginPath, fsPluginContent, 'utf8');
  console.log('  ✅ Replaced FilesystemPlugin.swift with clean Swift 6 implementation');
}

// 6. Patch FilesystemLocationResolver.swift
const fsResolverPath = path.join(__dirname, '..', 'node_modules', '@capacitor', 'filesystem', 'ios', 'Sources', 'FilesystemPlugin', 'FilesystemLocationResolver.swift');
if (fs.existsSync(fsResolverPath)) {
  const fsResolverContent = `import Capacitor
import Foundation
import IONFilesystemLib

struct FilesystemLocationResolver {
    let service: FileService

    func resolveSinglePath(from call: CAPPluginCall) -> Result<URL, FilesystemError> {
        guard let path = call.options[Constants.MethodParameter.path] as? String else {
            return .failure(.invalidInput(method: call.getIONFileMethod()))
        }

        let directory = call.getSearchPath(Constants.MethodParameter.directory)
        return resolveURL(path: path, directory: directory)
    }

    func resolveDualPaths(from call: CAPPluginCall) -> Result<(source: URL, destination: URL), FilesystemError> {
        guard let fromPath = call.options[Constants.MethodParameter.from] as? String, let toPath = call.options[Constants.MethodParameter.to] as? String else {
            return .failure(.invalidInput(method: call.getIONFileMethod()))
        }

        let fromDirectory = call.getSearchPath(Constants.MethodParameter.directory)
        let toDirectory = call.getSearchPath(Constants.MethodParameter.toDirectory, withDefault: fromDirectory)

        return resolveURL(path: fromPath, directory: fromDirectory)
            .flatMap { sourceURL in
                resolveURL(path: toPath, directory: toDirectory)
                    .map { (source: sourceURL, destination: $0) }
            }
    }

    private func resolveURL(path: String, directory: IONFILESearchPath) -> Result<URL, FilesystemError> {
        return if let url = try? service.getFileURL(atPath: path, withSearchPath: directory) {
            .success(url)
        } else {
            .failure(.invalidPath(path))
        }
    }
}
`;
  fs.writeFileSync(fsResolverPath, fsResolverContent, 'utf8');
  console.log('  ✅ Replaced FilesystemLocationResolver.swift with clean Swift 6 implementation');
}

// 7. Patch CAPPluginCall+Accelerators.swift
const fsAccPath = path.join(__dirname, '..', 'node_modules', '@capacitor', 'filesystem', 'ios', 'Sources', 'FilesystemPlugin', 'CAPPluginCall+Accelerators.swift');
if (fs.existsSync(fsAccPath)) {
  const fsAccContent = `import Capacitor
import Foundation
import IONFilesystemLib

extension CAPPluginCall {
    func getEncoding(_ key: String) -> IONFILEEncoding {
        if let encodingParameter = options[key] as? String {
            return IONFILEEncoding.string(encoding: .create(from: encodingParameter))
        } else {
            return IONFILEEncoding.byteBuffer
        }
    }

    func getSearchPath(_ key: String) -> IONFILESearchPath {
        getSearchPath(key, withDefaultSearchPath: .raw, andDefaultDirectoryType: .document)
    }

    func getSearchPath(_ key: String, withDefault defaultValue: IONFILESearchPath) -> IONFILESearchPath {
        getSearchPath(key, withDefaultSearchPath: defaultValue)
    }

    func getEncodingMapper() -> IONFILEEncodingValueMapper? {
        guard let data = options[Constants.MethodParameter.data] as? String else {
            return nil
        }
        switch getEncoding(Constants.MethodParameter.encoding) {
        case .byteBuffer:
            let cleanData = data.contains(",") ? String(data.split(separator: ",").last ?? "") : data
            if let base64Data = Data(base64Encoded: cleanData) {
                return IONFILEEncodingValueMapper.byteBuffer(value: base64Data)
            } else {
                return nil
            }
        case .string(encoding: let stringEncoding):
            return IONFILEEncodingValueMapper.string(encoding: stringEncoding, value: data)
        @unknown default:
            return nil
        }
    }

    func getIONFileMethod() -> IONFileMethod {
        return IONFileMethod(rawValue: self.methodName) ?? IONFileMethod.getUri
    }

    func handleSuccess(_ data: PluginCallResultData?, _ keepCallAlive: Bool = false) {
        keepAlive = keepCallAlive
        if let data {
            resolve(data)
        } else {
            resolve()
        }
    }

    func handlePermissionSuccess() {
        handleSuccess([Constants.ResultDataKey.publicStorage: Constants.ResultDataValue.granted])
    }

    func handleError(_ error: FilesystemError) {
        errorHandler?(nil)
    }

    private func getSearchPath(
        _ key: String, withDefaultSearchPath defaultSearchPath: IONFILESearchPath, andDefaultDirectoryType defaultDirectoryType: IONFILEDirectoryType? = nil
    ) -> IONFILESearchPath {
        guard let directoryParameter = options[key] as? String, directoryParameter.isEmpty == false else {
            return defaultSearchPath
        }

        return if let type = IONFILEDirectoryType.create(from: directoryParameter) ?? defaultDirectoryType {
            .directory(type: type)
        } else {
            defaultSearchPath
        }
    }
}
`;
  fs.writeFileSync(fsAccPath, fsAccContent, 'utf8');
  console.log('  ✅ Replaced CAPPluginCall+Accelerators.swift with clean Swift 6 implementation');
}

// 7. Ensure IconSwitcherPlugin is registered in packageClassList for iOS Capacitor Bridge
const capConfigPath = path.join(__dirname, '..', 'ios', 'App', 'App', 'capacitor.config.json');
if (fs.existsSync(capConfigPath)) {
  try {
    const raw = fs.readFileSync(capConfigPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed.packageClassList && !parsed.packageClassList.includes('IconSwitcherPlugin')) {
      parsed.packageClassList.push('IconSwitcherPlugin');
      fs.writeFileSync(capConfigPath, JSON.stringify(parsed, null, '\t'), 'utf8');
      console.log('  ✅ Added IconSwitcherPlugin to packageClassList in capacitor.config.json');
    }
  } catch (err) {
    console.error('  ⚠️ Could not patch capacitor.config.json:', err);
  }
}

console.log('🎉 Capacitor 8 patches successfully applied!');
