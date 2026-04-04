def process(data, flag, mode, config):
    if flag:
        for item in data:
            if item > 0:
                if mode == 'A':
                    if config.enabled:
                        for sub in item:
                            if sub != None:
                                if sub > 10:
                                    data.append(sub)
                                else:
                                    data.remove(sub)
                    elif mode == 'B':
                        for sub in item:
                            if sub > 5:
                                flag = False
                            else:
                                flag = True
                else:
                    for sub in item:
                        if sub == 0:
                            return None
    return data

def add(a, b):
    return a + b

def validate(x):
    if x is None:
        return False
    if x < 0:
        return False
    if x > 1000:
        return False
    return True